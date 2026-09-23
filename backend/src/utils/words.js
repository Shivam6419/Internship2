// Comprehensive categorized words bank for skribbl.io clone
// Grouped into Animals, Objects, Actions, Food, Places, Nature

export const WORD_BANK = {
  animals: [
    'cat', 'dog', 'elephant', 'giraffe', 'lion', 'tiger', 'monkey', 'panda', 'penguin', 'kangaroo',
    'dolphin', 'whale', 'shark', 'octopus', 'rabbit', 'hamster', 'snake', 'turtle', 'frog', 'bear',
    'zebra', 'crocodile', 'parrot', 'eagle', 'owl', 'butterfly', 'bee', 'spider', 'camel', 'duck'
  ],
  objects: [
    'pencil', 'laptop', 'guitar', 'chair', 'table', 'clock', 'camera', 'telephone', 'bicycle', 'car',
    'airplane', 'rocket', 'umbrella', 'scissors', 'glasses', 'backpack', 'bottle', 'candle', 'key', 'sword',
    'lamp', 'television', 'headphone', 'wallet', 'toothbrush', 'mirror', 'ladder', 'telescope', 'hammer', 'book'
  ],
  actions: [
    'running', 'sleeping', 'dancing', 'swimming', 'cooking', 'flying', 'singing', 'crying', 'laughing', 'climbing',
    'reading', 'painting', 'fishing', 'jumping', 'driving', 'eating', 'skating', 'skipping', 'shopping', 'dreaming'
  ],
  food: [
    'pizza', 'burger', 'apple', 'banana', 'cake', 'cookie', 'icecream', 'sandwich', 'pasta', 'taco',
    'popcorn', 'donut', 'sushi', 'chocolate', 'strawberry', 'watermelon', 'pancake', 'egg', 'cheese', 'pineapple'
  ],
  nature: [
    'mountain', 'rainbow', 'sunflower', 'volcano', 'waterfall', 'island', 'cloud', 'lightning', 'forest', 'beach',
    'desert', 'river', 'tree', 'moon', 'star', 'campfire', 'tornado', 'ocean', 'snowflake', 'flower'
  ]
};

// Flattened list of all words for quick random selection
export const ALL_WORDS = [
  ...WORD_BANK.animals,
  ...WORD_BANK.objects,
  ...WORD_BANK.actions,
  ...WORD_BANK.food,
  ...WORD_BANK.nature
];

/**
 * Returns N random words from the word list ensuring no duplicates
 * @param {number} count Number of words to select (typically 3)
 * @returns {string[]}
 */
export function getRandomWords(count = 3) {
  const shuffled = [...ALL_WORDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
