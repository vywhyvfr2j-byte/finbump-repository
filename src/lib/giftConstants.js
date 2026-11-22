import { Gem, Ticket, Shirt, Droplet, Palette, MoreHorizontal } from 'lucide-react';

export const CATEGORIES = ['Jewelry', 'Experiences', 'Ring Size', 'Gem Preference', 'Clothing Size', 'Fragrance', 'Colors', 'Other'];

export const OCCASIONS = ['Birthday', 'Christmas', 'Anniversary', 'Other'];

export const CATEGORY_ICONS = {
  Jewelry: Gem,
  Experiences: Ticket,
  'Ring Size': Gem,
  'Gem Preference': Gem,
  'Clothing Size': Shirt,
  Fragrance: Droplet,
  Colors: Palette,
  Other: MoreHorizontal,
};

export const CATEGORY_OPTIONS = {
  Jewelry: ['Gold', 'Silver', 'Rose Gold', 'White Gold', 'Platinum'],
  Experiences: ['Concerts', 'Travel', 'Fine Dining', 'Spa Days', 'Outdoor Adventures'],
  'Ring Size': ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'],
  'Gem Preference': ['Diamond', 'Sapphire', 'Emerald', 'Ruby', 'Pearl', 'Opal'],
  'Clothing Size': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  Fragrance: ['Floral', 'Woody', 'Citrus', 'Fresh', 'Sweet', 'Spicy'],
  Colors: ['Black', 'White', 'Blue', 'Red', 'Green', 'Pink', 'Purple', 'Yellow'],
  Other: [],
};