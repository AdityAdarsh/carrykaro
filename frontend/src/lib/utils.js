export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatCurrency(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}

export const CITIES = [
  'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai',
  'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat',
]

export const ITEM_TYPES = [
  { value: 'documents', label: 'Documents' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'food', label: 'Food' },
  { value: 'gifts', label: 'Gifts' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'other', label: 'Other' },
]

export const TRAVEL_MODES = [
  { value: 'flight', label: 'Flight' },
  { value: 'train', label: 'Train' },
  { value: 'bus', label: 'Bus' },
  { value: 'car', label: 'Car' },
  { value: 'other', label: 'Other' },
]
