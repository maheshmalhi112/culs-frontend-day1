// Loads the herbs from data/herbs.json and shows each one as a card.

const list = document.querySelector("#herbs-list")
const count = document.querySelector(".count")

async function loadHerbs() {
  const response = await fetch("data/herbs.json")
  if (!response.ok) {
    throw new Error(`Could not load ${response.url}: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

function element(tag, className, text) {
  const node = document.createElement(tag)
  node.className = className
  node.textContent = text
  return node
}

// function card(herb) {
//   const item = element("li", "card", "")
//   item.append(
//     element("h3", "name", herb.name),
//     element("p", "latin", herb.latin),
//     element("p", "use", herb.use),
//     element("p", "life", herb.life))
//   return item
// }

function card(herb) {
  const item = element("li", "card", "");
  
  // Content elements jo har card ke andar honge
  const content = [
    element("h3", "name", herb.name),
    element("p", "latin", herb.latin),
    element("p", "use", herb.use),
    element("p", "life", herb.life)
  ];

  //updated js for lavender card to link to lavender.html
  if (herb.name.toLowerCase() === 'lavender') {
    const link = element("a", "card-link", "");
    link.href = "lavender.html"; 
    link.append(...content);     
    item.append(link);
  } else {
   
    item.append(...content);
  }

  return item;
}

async function show() {
  const herbs = await loadHerbs()
  list.replaceChildren(...herbs.map(card))
  count.textContent = `${herbs.length} herbs grow here.`
}

show()
