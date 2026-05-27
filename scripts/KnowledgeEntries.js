export const entries = [

  {
    title: 'French Press Brewing Guide',
    category: 'brew_guide',
    content: `French press is the most beginner-friendly full-immersion brewing method.

Equipment: French press (350ml or 600ml), coarse ground coffee, kettle, timer.

Ratio: 1:15 coffee to water. For 300ml water use 20g coffee.

Steps:
1. Preheat French press with hot water, then discard.
2. Add coarse ground coffee (like breadcrumbs, not powder).
3. Pour hot water at 90-96°C in a slow circular motion. Fill completely.
4. Stir gently, place lid on without pressing.
5. Steep for 4 minutes.
6. Press plunger down slowly and steadily.
7. Pour immediately — do not let it sit or it over-extracts.

Troubleshooting:
- Sour taste: grind coarser or steep longer.
- Bitter taste: grind coarser or use lower temperature.
- Muddy/gritty: grind too fine, use coarser setting.
- Weak coffee: increase dose or steep 30 seconds longer.

Philippines budget: A decent French press costs ₱300-₱800 on Shopee/Lazada.`,
    metadata: {
      difficulty: 'beginner',
      brew_time_minutes: 4,
      equipment_cost_php: '300-800',
      tags: ['french press', 'immersion', 'beginner', 'full body']
    }
  },

{
    title: 'V60 Pour-Over Brewing Guide',
    category: 'brew_guide',
    content: `V60 pour-over produces clean, bright, and nuanced coffee.

Equipment: V60 dripper, paper filter, gooseneck kettle (ideal), server or mug.

Ratio: 1:16. For 240ml water use 15g coffee. Medium-fine grind (like table salt).

Steps:
1. Place filter in V60, rinse with hot water to remove paper taste. Discard water.
2. Add ground coffee, make a small well in the center.
3. Bloom pour: add 2x water to coffee weight (30ml for 15g) — wait 30 seconds.
4. Pour in slow spirals from center outward, keeping water level steady.
5. Total pour time: 2:30 to 3:00 minutes.
6. Lift dripper, serve immediately.

Grind guide: Too fast drip = grind finer. Too slow = grind coarser.

Philippines budget: Plastic V60 costs ₱200-₱500, ceramic ₱600-₱1500.`,
    metadata: {
      difficulty: 'intermediate',
      brew_time_minutes: 3,
      equipment_cost_php: '200-1500',
      tags: ['v60', 'pour-over', 'clean cup', 'filter coffee']
    }
  },

  {
    title: 'Moka Pot Brewing Guide',
    category: 'brew_guide',
    content: `Moka pot brews strong, concentrated coffee similar to espresso using steam pressure.

Equipment: Moka pot (stovetop), fine-medium ground coffee, stove or gas burner.

Ratio: Fill bottom chamber with water up to the safety valve. Fill filter basket level.

Steps:
1. Fill bottom chamber with cold or warm water up to the pressure valve.
2. Fill filter basket with ground coffee, do not tamp — just level off.
3. Screw top and bottom firmly.
4. Place on low-medium heat. Keep lid open to watch.
5. When coffee starts flowing into upper chamber (golden color), reduce heat.
6. Remove from heat when you hear sputtering/gurgling sounds.
7. Run bottom under cold water to stop extraction.

Common mistakes: Too high heat = bitter burnt taste. Overfilling basket = pressure buildup danger.

Philippines budget: Bialetti moka pot ₱800-₱2000. Local brands ₱300-₱600.`,
    metadata: {
      difficulty: 'beginner',
      brew_time_minutes: 5,
      equipment_cost_php: '300-2000',
      tags: ['moka pot', 'stovetop', 'strong', 'espresso-like', 'bialetti']
    }
  },

  {
    title: 'Beginner Espresso Guide',
    category: 'brew_guide',
    content: `Espresso is a concentrated coffee brewed by forcing hot water through finely ground coffee.

Key variables: dose, grind size, yield, time.

Standard shot: 18g coffee in → 36g espresso out in 25-30 seconds.

Equipment needed: Espresso machine with pump (9 bar), portafilter, tamper, scale, grinder.

Steps:
1. Flush grouphead with hot water first.
2. Dose 18g of fine ground coffee into portafilter.
3. Distribute evenly then tamp with firm flat pressure.
4. Lock portafilter and start extraction immediately.
5. Target: 25-30 seconds for a double shot (36ml).

Dialing in:
- Shot too fast / sour: grind finer.
- Shot too slow / bitter: grind coarser.
- Channeling (uneven flow): improve distribution and tamp.

Philippines beginner machines: Delonghi EC series ₱5000-₱15000. Flair manual espresso ₱3500-₱6000.`,
    metadata: {
      difficulty: 'intermediate',
      brew_time_minutes: 1,
      equipment_cost_php: '3500-15000',
      tags: ['espresso', 'machine', 'pressure', 'concentrated', 'delonghi', 'flair']
    }
  },

  {
    title: 'Iced Coffee Methods Guide',
    category: 'brew_guide',
    content: `Three main iced coffee methods for the Philippines climate.

1. Japanese Iced Pour-Over (flash brew):
Brew V60 directly over ice. Use 40% ice, 60% hot water in recipe.
Example: 15g coffee, 140ml hot water poured over 100g ice.
Result: Bright, clean, instantly chilled.

2. Cold Brew:
Coarse ground coffee steeped in cold water 12-24 hours in the fridge.
Ratio: 1:8 for concentrate, 1:15 for ready-to-drink.
No heat involved — naturally low acidity, sweet, smooth.
Philippines tip: Use local dark roast beans for chocolatey cold brew.

3. Iced Espresso / Americano:
Pull a double shot, pour over ice, add cold water or milk.
Popular base for milk coffee drinks.

Equipment needed by method:
- Flash brew: V60 setup + ice
- Cold brew: jar or pitcher + filter cloth/bag
- Iced espresso: espresso machine or moka pot

Philippines budget: Cold brew jar setup ₱200-₱500. Flash brew = V60 you already have.`,
    metadata: {
      difficulty: 'beginner',
      brew_time_minutes: 0,
      equipment_cost_php: '200-500',
      tags: ['iced coffee', 'cold brew', 'flash brew', 'summer', 'philippines', 'milk coffee']
    }
  },


  {
    title: 'Coffee Flavor Profiles and Roast Level Guide',
    category: 'flavor',
    content: `Understanding roast levels helps you choose beans that match your taste.

LIGHT ROAST:
- Flavor: Fruity, floral, acidic, tea-like, complex.
- Best for: Pour-over, V60, filter methods.
- Origin examples: Ethiopian Yirgacheffe (blueberry, jasmine), Kenyan AA (blackcurrant).
- Philippines availability: specialty coffee shops, online roasters.

MEDIUM ROAST:
- Flavor: Balanced, chocolatey, nutty, caramel, mild acidity.
- Best for: French press, drip, espresso blends.
- Origin examples: Colombian Supremo (caramel, hazelnut), Benguet (Philippine local, nutty).
- Philippines availability: widely available, most commercial bags.

DARK ROAST:
- Flavor: Bold, smoky, bittersweet, low acidity, heavy body.
- Best for: Moka pot, espresso machines, cold brew.
- Origin examples: Robusta blends, Italian-style espresso blends.
- Philippines availability: Barako (local Liberica, strong and earthy), commercial dark blends.

FLAVOR PROFILE MATCHING:
- Want chocolatey/nutty? → Medium roast Colombian, Benguet, Sagada beans.
- Want fruity/bright? → Light roast Ethiopian or Kenyan single origin.
- Want strong/bold? → Dark roast, Barako, Robusta blends.
- Want sweet milk coffee? → Medium-dark espresso blend with milk or creamer.
- Budget beans PH: Benguet ₱150-₱300 / 100g. Sagada ₱200-₱400 / 100g.`,
    metadata: {
      difficulty: 'beginner',
      tags: ['flavor', 'roast level', 'light roast', 'dark roast', 'medium roast',
             'barako', 'benguet', 'sagada', 'ethiopian', 'colombian', 'philippines beans']
    }
  }

];