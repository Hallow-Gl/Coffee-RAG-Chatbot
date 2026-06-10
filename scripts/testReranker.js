import 'dotenv/config';
import { rerankProducts } from '../src/services/rerankService.js';

const query = 'best beginner coffee grinder under ₱3000';

const sampleProducts = [
  {
    title: 'Premium Electric Espresso Grinder 64mm Burr',
    price: '₱15,000',
    link: 'https://example.com/premium-grinder',
    source: 'Example Coffee Store',
    rating: 4.8,
    image: null,
  },
  {
    title: 'Timemore Chestnut C2 Manual Coffee Grinder',
    price: '₱2,450',
    link: 'https://example.com/timemore-c2',
    source: 'Shopee',
    rating: 4.7,
    image: null,
  },
  {
    title: 'Blade Spice and Coffee Grinder',
    price: '₱650',
    link: 'https://example.com/blade-grinder',
    source: 'Lazada',
    rating: 4.1,
    image: null,
  },
  {
    title: 'Reusable Coffee Filter Basket',
    price: '₱180',
    link: 'https://example.com/filter',
    source: 'Shopee',
    rating: 4.3,
    image: null,
  },
];

function printOrder(title, products) {
  console.log(`\n=== ${title} ===`);
  products.forEach((product, index) => {
    const score = product.rerankScore === undefined ? '' : ` (${product.rerankScore})`;
    console.log(`${index + 1}. ${product.title}${score}`);
    if (product.rerankReason) console.log(`Reason: ${product.rerankReason}`);
  });
}

function createMockModel(text) {
  return {
    async generateContent() {
      return {
        response: {
          text: () => text,
        },
      };
    },
  };
}

async function runFailurePathTest() {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => {
    warnings.push(args.join(' '));
    originalWarn(...args);
  };

  try {
    const result = await rerankProducts(query, sampleProducts, {
      model: createMockModel('{ "rankings": [{ "index": 1, "score": "not-a-score" }] }'),
    });

    const preservedOrder = result.every((product, index) => product === sampleProducts[index]);

    console.log('\n=== FAILURE PATH TEST ===');
    console.log(`Returned original products: ${preservedOrder ? 'yes' : 'no'}`);
    console.log(`Warnings logged: ${warnings.length}`);
  } finally {
    console.warn = originalWarn;
  }
}

async function test() {
  printOrder('RAW PRODUCTS', sampleProducts);

  console.log('\n=== CALLING RERANKER ===');

  const rerankedProducts = await rerankProducts(query, sampleProducts);

  console.log('\n=== FINAL OUTPUT DEBUG ===');

  rerankedProducts.forEach((product, index) => {
    const score =
      product.rerankScore !== undefined
        ? ` (${product.rerankScore})`
        : '';

    console.log(`${index + 1}. ${product.title}${score}`);

    if (product.rerankReason) {
      console.log(`Reason: ${product.rerankReason}`);
    }

    if (product.beginnerFriendly !== undefined) {
      console.log(`Beginner Friendly: ${product.beginnerFriendly}`);
    }
  });

  await runFailurePathTest();
}

test().catch(err => {
  console.error('[testReranker] unexpected error:', err);
  process.exitCode = 1;
});

