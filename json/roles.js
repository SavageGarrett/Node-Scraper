let chlidren = document.querySelector("#root > div:nth-child(1) > div.ais-InstantSearch__root > section > div > form > div.equal.width.fields.mc-mobile-filters > div:nth-child(2) > div > div.visible.menu.transition").childElementCount;
let roleString = "{\n";
let link = "https://accelerate.masschallenge.org/people/?refinementList%5Bfinalist_user_roles%5D%5B0%5D=";
for (let i = 1; i <= chlidren; i++) {
    let role = document.querySelector(`#root > div:nth-child(1) > div.ais-InstantSearch__root > section > div > form > div.equal.width.fields.mc-mobile-filters > div:nth-child(2) > div > div.visible.menu.transition > div:nth-child(${i}) > span.text`).textContent
    let num = document.querySelector(`#root > div:nth-child(1) > div.ais-InstantSearch__root > section > div > form > div.equal.width.fields.mc-mobile-filters > div:nth-child(2) > div > div.visible.menu.transition > div:nth-child(${i}) > span.description`).textContent
    roleString += `\t"${link}${escape(role)}&page=" : ${num},\n`
}
roleString += "}"