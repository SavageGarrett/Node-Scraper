console.log('{')
for (let i = 1; i <= 33; i++) {
    let name = document.querySelector("#root > div:nth-child(1) > div.ais-InstantSearch__root > section > div > form > div.equal.width.fields.mc-mobile-filters > div:nth-child(1) > div > div.visible.menu.transition > div:nth-child(" + i +")").textContent
    name = name.split(' ')
    let fullName = name.join("%20")
    let num = document.querySelector("#root > div:nth-child(1) > div.ais-InstantSearch__root > section > div > form > div.equal.width.fields.mc-mobile-filters > div:nth-child(1) > div > div.visible.menu.transition > div:nth-child(" + i + ") > span.description").textContent
    console.log(`"https://accelerate.masschallenge.org/people/?refinementList%5Bprogram%5D%5B0%5D=${fullName}&page=" : ${num},`)
}
console.log("}")