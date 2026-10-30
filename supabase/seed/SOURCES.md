# Where the starting lists come from

`launch-lists.sql` adds real dishes at real places in Hyderabad and Bengaluru, picked from the public food guides below
(sources and checking dates as recorded by whoever gathered the lists, October 2026). They start with no ratings.
Places can close or change, so treat this as a starting point and fix anything wrong from the admin site.

| City | List | Sources |
| --- | --- | --- |
| Bengaluru | Biryani | District (Aug 2026), Swiggy (Jul 2026) |
| Bengaluru | Mandi | Curly Tales (Feb 2026) |
| Bengaluru | Chicken 65 | LBB Bengaluru |
| Bengaluru | Kebabs | LBB Bengaluru, Curly Tales (Feb 2026) |
| Bengaluru | Shawarma | Curly Tales (Feb 2026), LBB, EazyDiner listings |
| Bengaluru | Meals (Andhra) | LBB Bengaluru |
| Bengaluru | Dosa | LBB Bengaluru, Swiggy (Jun 2026) |
| Bengaluru | Idli and vada | Pratik Chandak, The Better India |
| Bengaluru | Filter coffee | Curly Tales (Oct 2025) |
| Bengaluru | Irani chai | none listed |
| Bengaluru | Indo-Chinese | District (Aug 2026) |
| Bengaluru | Momos | District (Sep 2026) |
| Bengaluru | Pizza | The Nod (Aug 2026), Shoba Narayan |
| Bengaluru | Burgers | District (Aug 2026) |
| Bengaluru | Desserts | Outlook Traveller, Culture Trip |
| Hyderabad | Biryani | The Hosteller (Jul 2026), EazyDiner (Aug 2026) |
| Hyderabad | Mandi | Siasat (updated May 2025) |
| Hyderabad | Chicken 65 | Outlook Traveller |
| Hyderabad | Kebabs | Esquire India (Jul 2026), ETV Bharat (Jul 2025) |
| Hyderabad | Shawarma | Curly Tales (Oct 2025), Siasat (May 2026) |
| Hyderabad | Meals (Andhra) | LBB Hyderabad, ThePrint (Sep 2026) |
| Hyderabad | Dosa | LBB Hyderabad, Siasat (Apr 2026) |
| Hyderabad | Idli and vada | LBB Hyderabad, Mohamushkil |
| Hyderabad | Filter coffee | Swiggy (Jul 2026), EazyDiner |
| Hyderabad | Irani chai | Outlook Traveller (Nov 2024), Curly Tales (May 2025) |
| Hyderabad | Indo-Chinese | LBB Hyderabad, magicpin (2026) |
| Hyderabad | Momos | Siasat (Aug 2025) |
| Hyderabad | Pizza | LBB Hyderabad, The Nod (Aug 2026) |
| Hyderabad | Burgers | District (Aug 2026), Siasat (Aug 2025) |
| Hyderabad | Desserts | Siasat, The Hosteller |

## Left out: no veg or non-veg mark in the source

A wrong diet mark would put meat in front of a vegetarian, so these 18 were not imported. Add them from the
admin site (Restaurants, then the place) once someone has checked what they are:

- Tandoori Momos at Fat Guy's Momos (Madhapur, Hyderabad)
- Steamed Momos at Kathmandu Momos (Somajiguda, Hyderabad)
- Steamed Momos at Momo Hut (Koti, Hyderabad)
- Pan-fried Momos at Momos Delight (Gachibowli, Hyderabad)
- Tre Peperoni at Flying Spaghetti Monster (Banjara Hills, Hyderabad)
- Chicago-style Deep Dish Pizza at Nove (Banjara Hills, Hyderabad)
- Atomic Bomb Burger at Chef Inam's KOB (Banjara Hills, Hyderabad)
- Nutella Brownie Ice Cream at Cream Stone (Several outlets, Hyderabad)
- Jauzi Halwa at Hameedi Confectioners (Nampally, Hyderabad)
- Coconut Macaroons at Nimrah Cafe & Bakery (Charminar, Hyderabad)
- Chung Wah Chowmein at Chung Wah (Residency Road, Bengaluru)
- Chilli Garlic Noodles at Sichuan (HSR Layout, Bengaluru)
- Jhol Momo at Bamey's Restro Cafe (Koramangala, Bengaluru)
- Jay's Special Bianco at Lyfe (Whitefield, Bengaluru)
- Pinsa Romana Speziato at Spettacolare (Indiranagar, Bengaluru)
- The Kerfuffle at Good Flippin' Burgers (Several outlets, Bengaluru)
- Death by Chocolate at Corner House (Several outlets, Bengaluru)
- Banana Pudding at Magnolia Bakery (Indiranagar, Bengaluru)

## Mumbai and Delhi

`mumbai-delhi-lists.sql` adds a shorter starting list for these two cities, gathered from the guides below in October 2026.
Every place is named by at least one guide, but the guides vary in age and some disagree, so fix anything wrong from the
admin site. Diet marks were set by hand from the dish itself.

| City | List | Sources |
| --- | --- | --- |
| Mumbai | Vada pav | [EazyDiner](https://www.eazydiner.com/food-trends/a-foodies-guide-to-the-best-vada-pav-serving-places-in-mumbai), [The Hosteller](https://www.thehosteller.com/blogs/must-try-vada-pav-stores-in-mumbai) |
| Mumbai | Pav bhaji, misal | [The Hosteller](https://www.thehosteller.com/blogs/from-vada-pav-to-malvani-masala-food-guide-to-Mumbai), [EazyDiner](https://www.eazydiner.com/food-trends/the-ultimate-guide-to-mumbais-finest-street-food-joints) |
| Mumbai | Biryani | [LBB](https://lbb.in/mumbai/Best-Biryani-Joints-Mumbai-Food/) |
| Mumbai | Seafood | [LBB](https://lbb.in/mumbai/seafood-restaurants-in-mumbai), [Homegrown](https://homegrown.co.in/article/13267/bombays-14-best-seafood-meals-for-every-budget) |
| Mumbai | Kebabs | [TableJourney](https://tablejourney.com/india/mumbai/restaurants/) |
| Mumbai | Dosa, idli, filter coffee | [Culture Trip](https://theculturetrip.com/asia/india/articles/the-6-best-south-indian-eateries-of-matunga), [Curly Tales](https://curlytales.com/10-best-south-indian-restaurants-in-mumbai-you-have-to-try-once/) |
| Delhi | Chole bhature | [Homegrown](https://homegrown.co.in/homegrown-explore/a-homegrown-guide-to-delhis-iconic-chole-bhature-spots) |
| Delhi | Butter chicken, nihari, paratha | [Culture Trip](https://theculturetrip.com/asia/india/articles/the-most-popular-dishes-in-delhi-india), [Slurrp](https://slurrp.com/article/exploring-delhis-top-10-famous-dishes-and-iconic-foods-1698923488399) |
| Delhi | Kebabs | [Curly Tales](https://curlytales.com/?p=517987) |
| Delhi | Momos | [Homegrown](https://homegrown.co.in/article/802349/a-locals-guide-to-delhis-best-momos), [Slurrp](https://slurrp.com/article/dolma-aunty-to-qds-10-iconic-momo-places-in-delhi-1695023727765) |
| Delhi | Chaat, desserts | [Holidify](https://www.holidify.com/pages/street-food-in-old-delhi-3670.html), [Slurrp](https://www.slurrp.com/article/beyond-mithai-delhis-five-iconic-sweet-treats-1647917381209) |
