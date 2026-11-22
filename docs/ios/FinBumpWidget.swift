//
//  FinBumpWidget.swift
//  FinBump Widget Extension
//
//  Template for the iOS home-screen countdown widget.
//  Polls the get-next-countdown backend endpoint and renders the soonest
//  upcoming birthday, anniversary, gotcha day, milestone, or event as a
//  compact countdown tile. Tapping the widget deep-links into the app.
//
//  SETUP CHECKLIST (Xcode):
//  1. File → New → Target → Widget Extension. Name it "FinBumpWidget".
//  2. Enable the "App Groups" capability on BOTH the main app and the widget
//     extension, using the same group ID (e.g. "group.com.finbump.app").
//     The App Group lets the widget read the user's auth token that the main
//     app writes to shared UserDefaults.
//  3. Replace this file's contents with the code below.
//  4. Set the widget's refresh cadence in the TimelineProvider (see
//     `nextRefresh` — currently every 60 minutes).
//
//  AUTH TOKEN SHARING:
//  The main app must persist the user's Base44 session token to the shared
//  App Group UserDefaults so the widget can attach it to the endpoint call.
//  In the main app, after login, write:
//
//      let defaults = UserDefaults(suiteName: "group.com.finbump.app")!
//      defaults.set(sessionToken, forKey: "finbump_auth_token")
//
//  The widget reads it back (see `authToken()` below).
//
//  COUNTDOWN SNAPSHOT SHARING (recommended — instant widget renders):
//  For an always-correct, instant widget, the main app should also write a
//  lightweight countdown snapshot to the shared App Group on every foreground
//  and after every check-off/occasion change. The widget reads this snapshot
//  first and only falls back to the network when the snapshot is stale (>2h).
//
//  Write the snapshot as JSON with a "writtenAt" ISO-8601 timestamp:
//
//      struct Snapshot: Codable {
//          let response: CountdownResponse
//          let writtenAt: String  // ISO-8601, e.g. "2026-09-15T20:53:00Z"
//      }
//      let snap = Snapshot(response: countdownResponse, writtenAt: isoNow)
//      let data = try JSONEncoder().encode(snap)
//      defaults.set(data, forKey: "finbump_countdown_snapshot")
//
//  The widget's `readSnapshot()` decodes this and checks the age. When the
//  snapshot is fresh the widget never touches the network, so it renders
//  instantly and stays correct even offline.
//

import WidgetKit
import SwiftUI

// MARK: - Data model (matches the get-next-countdown response)

struct CountdownResponse: Codable {
    let hasUpcoming: Bool
    var days: Int?
    var label: String?
    var emoji: String?
    var kind: String?
    var date: String?
    var deepLink: String?
}

// MARK: - Timeline entry

struct CountdownEntry: TimelineEntry {
    let date: Date                  // when WidgetKit should display this entry
    let response: CountdownResponse
}

// MARK: - Timeline provider (reads shared snapshot, falls back to network)

struct CountdownProvider: TimelineProvider {
    // Endpoint URL — the published app's function path.
    // Update the host if you connect a custom domain.
    private let endpointURL = URL(string:
        "https://keepsake-memory-vault.base44.app/functions/get-next-countdown")!

    // Shared App Group for reading the auth token + snapshot written by the
    // main app. The main app writes a fresh countdown snapshot here on every
    // foreground and after every check-off, so the widget renders instantly
    // without waiting on a network fetch.
    private let appGroup = "group.com.finbump.app"
    private let tokenKey = "finbump_auth_token"
    private let snapshotKey = "finbump_countdown_snapshot"
    // Max staleness before the widget falls back to a network fetch.
    private let maxSnapshotAge: TimeInterval = 2 * 60 * 60  // 2 hours

    private func authToken() -> String? {
        UserDefaults(suiteName: appGroup)?.string(forKey: tokenKey)
    }

    // Reads the shared snapshot written by the main app. Returns nil when the
    // snapshot is missing or stale (older than maxSnapshotAge).
    private func readSnapshot() -> CountdownResponse? {
        guard let defaults = UserDefaults(suiteName: appGroup),
              let data = defaults.data(forKey: snapshotKey) else { return nil }
        // The snapshot is stored as JSON with a "writtenAt" ISO timestamp.
        struct Snapshot: Codable { let response: CountdownResponse; let writtenAt: String }
        guard let snap = try? JSONDecoder().decode(Snapshot.self, from: data) else { return nil }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let written = formatter.date(from: snap.writtenAt) else { return nil }
        if Date().timeIntervalSince(written) > maxSnapshotAge { return nil }
        return snap.response
    }

    func placeholder(in context: Context) -> CountdownEntry {
        // Shown in the widget gallery before real data loads.
        CountdownEntry(date: Date(), response: CountdownResponse(
            hasUpcoming: true, days: 3, label: "Mom's Birthday",
            emoji: "🎂", kind: "birthday", date: nil, deepLink: "/calendar"))
    }

    func getSnapshot(in context: Context, completion: @escaping (CountdownEntry) -> ()) {
        // Prefer the shared snapshot for an instant, always-correct render.
        if let cached = readSnapshot() {
            completion(CountdownEntry(date: Date(), response: cached))
            return
        }
        fetch { response in
            completion(CountdownEntry(date: Date(), response: response))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CountdownEntry>) -> ()) {
        // Prefer the shared snapshot; only hit the network when it's missing
        // or stale. This keeps the widget instant and resilient to WidgetKit's
        // network-refresh budgeting.
        if let cached = readSnapshot() {
            let nextRefresh = Date().addingTimeInterval(60 * 60)
            completion(Timeline(entries: [CountdownEntry(date: Date(), response: cached)], policy: .after(nextRefresh)))
            return
        }
        fetch { response in
            let nextRefresh = Date().addingTimeInterval(60 * 60)
            let entry = CountdownEntry(date: Date(), response: response)
            completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
        }
    }

    private func fetch(completion: @escaping (CountdownResponse) -> ()) {
        var request = URLRequest(url: endpointURL)
        request.httpMethod = "GET"

        // Attach the user's auth token so the endpoint can resolve their data.
        if let token = authToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        URLSession.shared.dataTask(with: request) { data, _, error in
            if let data = data {
                let decoded = try? JSONDecoder().decode(CountdownResponse.self, from: data)
                if let decoded = decoded {
                    completion(decoded)
                    return
                }
            }
            // On any failure, show the "nothing upcoming" state so the widget
            // never renders a broken/blank tile.
            completion(CountdownResponse(hasUpcoming: false))
        }.resume()
    }
}

// MARK: - Widget view

struct CountdownWidgetView: View {
    var entry: CountdownEntry

    // Parses the ISO-8601 date string returned by the endpoint.
    static let dateFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    // Formats the parsed date for display (e.g. "Sep 18").
    static let displayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .none
        return f
    }()

    var body: some View {
        let resp = entry.response

        if resp.hasUpcoming, let days = resp.days, let label = resp.label {
            // Active countdown tile
            ZStack {
                // Coral gradient background matching the in-app hero card
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(red: 0.88, green: 0.45, blue: 0.38),
                        Color(red: 0.90, green: 0.63, blue: 0.44)
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )

                HStack(spacing: 12) {
                    // Countdown badge
                    VStack(spacing: 2) {
                        if days == 0 {
                            Text("Today!")
                                .font(.system(.headline, design: .serif))
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        } else {
                            Text("\(days)")
                                .font(.system(.systemLargeTitle, design: .serif))
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            Text(days == 1 ? "DAY" : "DAYS")
                                .font(.system(.caption2))
                                .fontWeight(.medium)
                                .foregroundColor(Color.white.opacity(0.85))
                                .tracking(1)
                        }
                    }
                    .frame(width: 64, height: 64)
                    .background(Color.white.opacity(0.25))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.4), lineWidth: 1)
                    )
                    .cornerRadius(16)

                    // Occasion info
                    VStack(alignment: .leading, spacing: 3) {
                        Text(resp.emoji ?? "🎉")
                            .font(.system(.title3))
                        Text(days == 0 ? "IT'S TODAY" : days == 1 ? "TOMORROW" : "COMING UP")
                            .font(.system(.caption2))
                            .fontWeight(.semibold)
                            .foregroundColor(Color.white.opacity(0.95))
                            .tracking(1.5)
                        Text(label)
                            .font(.system(.subheadline, design: .serif))
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .lineLimit(2)
                            .minimumScaleFactor(0.8)
                        // Show the occasion date when the endpoint provides it.
                        if let dateStr = resp.date, let date = Self.dateFormatter.date(from: dateStr) {
                            Text(Self.displayFormatter.string(from: date))
                                .font(.system(.caption2))
                                .foregroundColor(Color.white.opacity(0.85))
                        }
                    }
                    Spacer(minLength: 0)
                }
                .padding(16)
            }
            // Deep-link tap to the occasion's route (card builder for
            // birthdays/anniversaries, calendar otherwise). Register the
            // "finbump" URL scheme in Info.plist and handle it via .onOpenURL
            // in the main app's SwiftUI scene (see file footer).
            .widgetURL(URL(string: "finbump://" + (resp.deepLink ?? "/calendar")))
        } else {
            // Nothing upcoming in the next 30 days
            ZStack {
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(red: 0.96, green: 0.93, blue: 0.90),
                        Color(red: 0.94, green: 0.88, blue: 0.82)
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )

                VStack(spacing: 6) {
                    Text("🐬")
                        .font(.system(.title))
                    Text("All caught up")
                        .font(.system(.subheadline, design: .serif))
                        .fontWeight(.semibold)
                        .foregroundColor(Color(red: 0.20, green: 0.18, blue: 0.16))
                    Text("No occasions in the next 30 days")
                        .font(.system(.caption2))
                        .foregroundColor(Color(red: 0.20, green: 0.18, blue: 0.16).opacity(0.7))
                        .multilineTextAlignment(.center)
                }
                .padding(16)
            }
            .widgetURL(URL(string: "finbump:///calendar"))
        }
    }
}

// MARK: - Widget configuration

struct FinBumpCountdownWidget: Widget {
    let kind = "FinBumpCountdownWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CountdownProvider()) { entry in
            CountdownWidgetView(entry: entry)
        }
        .configurationDisplayName("FinBump Countdown")
        .description("Shows your next upcoming birthday, anniversary, or occasion.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Widget bundle (entry point for the extension)

@main
struct FinBumpWidgetBundle: WidgetBundle {
    var body: some Widget {
        FinBumpCountdownWidget()
    }
}

// MARK: - Deep-link handling (in the MAIN app, not the widget)
//
// The widget sets a widgetURL so tapping it opens the app at the occasion's
// route. The main app's scene must handle the incoming URL and route to the
// deep-link path returned by the endpoint (e.g. /card-builder?personId=…).
//
// 1. Register the "finbump" URL scheme in Info.plist:
//    <key>CFBundleURLTypes</key>
//    <array><dict>
//      <key>CFBundleURLName</key><string>com.finbump.app</string>
//      <key>CFBundleURLSchemes</key><array><string>finbump</string></array>
//    </dict></array>
//
// 2. In your main app's SwiftUI scene, handle the incoming URL:
//
//   .onOpenURL { url in
//       // url.path + url.query -> route to CardBuilder or Calendar
//       // e.g. "finbump://card-builder?personId=abc&occasion=birthday"
//       DeepLinkRouter.handle(url)
//   }
//
// The deepLink field from the endpoint is a relative path like
// "/card-builder?personId=abc&occasion=birthday". The widget constructs the
// full URL as "finbump://card-builder?personId=abc&occasion=birthday" and
// passes it via widgetURL so .onOpenURL receives it.