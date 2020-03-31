const puppeteer = require('puppeteer')
const fs = require('fs')

const email = "EMAIL"
const pass = "PASSWORD"

// Login to masschallenge and return browser object
async function login() {
    // Create Browser
    const browser = await puppeteer.launch({headless: true, devtools: false})

    // Create Login Page
    const page = await browser.newPage()

    // Intercept Costly Resources
    await page.setRequestInterception(true)
    page.on('request', (req) => {
        if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
            req.abort()
        }
        else {
            req.continue()
        }
    })

    // Go to Login Page
    await page.goto('https://accelerate.masschallenge.org/applicant/', {
        waitUntil: 'networkidle2'
    })

    // Email
    await page.waitForSelector("[id='id_email']")
    await page.type("[id='id_email']", email)

    // Password
    await page.keyboard.down("Tab")
    await page.keyboard.type(pass)

    // Finish login
    await page.keyboard.down("Tab")
    await page.keyboard.down("Enter")

    return browser
}

// Read a page full of cards
async function readCards(page) {
    let result = await page.evaluate(() => {
        let names = '{\n'
        let cards = document.getElementsByClassName("ui card mc-card")
        for (let i = 0; i < cards.length; i++) {
            let personLink = cards[i].firstChild.firstChild.lastChild.firstChild.href
            names += `\t"${personLink}" : 0`
            if (i != cards.length - 1) {
                names += ','
            }
            names += "\n"
        }
        names += '}'
        return Promise.resolve(names)
    })
    return result
}

// Concatentate JSON objects
function concat(obj1, obj2) {
    for(let key in obj2) {
        obj1[key] = obj2[key]
    }
    return obj1
}

// Load group of role pages
async function loadRolePage(browser, link, num) {
    const rolePage = await browser.newPage()

    await rolePage.setRequestInterception(true)
    rolePage.on('request', (req) => {
        if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
            req.abort()
        }
        else {
            req.continue()
        }
    })

    let links = {}
    let loopNum = Math.ceil(num/24)
    for (let page = 1; page <= loopNum; page++) {
        await rolePage.goto(link + page, {
            waitUntil: 'networkidle0'
        })
        let partialLinks = await readCards(rolePage)
        let partialJSONLinks = JSON.parse(partialLinks)
        links = concat(links, partialJSONLinks)
    }
    await rolePage.close()
    return links
}

// Loop through role page entries
async function loopEntries(fileName) {
    // Get JSON document with roles
    let roles = JSON.parse(fs.readFileSync(fileName))

    // Login and Get Browser Object
    let browser = await login()

    // Loop through pages
    let listNum = 1;
    for (personLink in roles) {
        let writeOut = await loadRolePage(browser, personLink, roles[personLink])
        //write out result variable
        await fs.writeFile(`json/lists/list${listNum}.json`, JSON.stringify(writeOut), (err) => {
            console.log(err)
        })
        console.log(`JSON file saved with ${roles[personLink]} entries`)
        listNum++
    }
}

async function pullPersonData(page) {
    try {
        const result = await page.evaluate(() => {
          // Get Name
          let name = document.querySelector("div:nth-child(1) > div.ui.container.mc-profile > div:nth-child(1) > div > div.computer.only.nine.wide.computer.column > div > h2")
          console.log(name)
          if(name == null) {
            return Promise.reject("Name Not Found")
          } else {
            name = name.textContent
          }

          let splitName = name.split(' ')
          let lname = splitName[splitName.length - 1]
          splitName.pop()
          let fname = splitName.join(' ')

          // Get MassChallenge program
          let program = document.querySelector("#root > div:nth-child(1) > div.ui.container.mc-profile > div.ui.centered.stackable.horizontally.padded.grid > div > div.four.wide.computer.sixteen.wide.mobile.five.wide.tablet.column > div > div > ul > li")

          if (program == null) program = 'null'
          else program = program.textContent

          // Get Company, Link, and Title
          let company = document.querySelector("#root > div:nth-child(1) > div.ui.container.mc-profile > div.ui.centered.stackable.horizontally.padded.grid > div > div.nine.wide.computer.sixteen.wide.mobile.ten.wide.tablet.column > div > div > div > div > div > div.mc-card__meta > div.header > a")
          let companyLink = document.querySelector("#root > div:nth-child(1) > div.ui.container.mc-profile > div.ui.centered.stackable.horizontally.padded.grid > div > div.nine.wide.computer.sixteen.wide.mobile.ten.wide.tablet.column > div > div > div > div > div > div.mc-card__meta > div.header > a")
          let title = document.querySelector("#root > div:nth-child(1) > div.ui.container.mc-profile > div:nth-child(1) > div > div.computer.only.nine.wide.computer.column > div > div.mc-profile__header-meta > div")

          // Verify Scraped Information
          if (company == null) company = 'null'
          else company = company.textContent

          if (companyLink == null) companyLink = 'null'
          else companyLink = companyLink.href

          if (title == null) title = 'null'
          else if (title.textContent == '') title = 'null'
          else title = title.textContent

          // Get Social Links
          let link1 = document.querySelector("#root > div:nth-child(1) > div.ui.container.mc-profile > div:nth-child(1) > div > div.computer.only.nine.wide.computer.column > div > a:nth-child(3)")
          let link2 = document.querySelector("#root > div:nth-child(1) > div.ui.container.mc-profile > div:nth-child(1) > div > div.computer.only.nine.wide.computer.column > div > a:nth-child(4)")
          let link3 = document.querySelector("#root > div:nth-child(1) > div.ui.container.mc-profile > div:nth-child(1) > div > div.computer.only.nine.wide.computer.column > div > a:nth-child(5)")
          
          // Get Linkedin from social links
          let linkedin
          if (link1 != null && link1.href.toLowerCase().includes('linkedin')) {
            linkedin = link1.href
          } else if (link2 != null && link2.href.toLowerCase().includes('linkedin')) {
            linkedin = link2.href
          } else if (link3 != null && link3.href.toLowerCase().includes('linkedin')) {
            linkedin = link3.href
          } else {
            linkedin = null
          }

          // Return Info
          let ret = {firstName: fname, lastName: lname, program: program, company: company, companyLink: companyLink, title: title, handle: linkedin}
          return Promise.resolve(ret)
        })
        return result
    } catch (err) {
        console.log(err)
    }
}

async function loopListData(page) {
    for (let i = 1; i <= 54; i++) {
        let listFile = JSON.parse(fs.readFileSync(`json/lists/list${i}.json`))
        let personData = 'First Name, Last Name, Email Address, Company Name, Company Domain, Linkedin Handle, MassChallenge Program, Title\n'
        for (let person in listFile) {
            try {
                await page.goto(person, {
                    waitUntil: "networkidle0"
                })
                csvData = await pullPersonData(page)
                const clickResponse = await page.click("#root > div:nth-child(1) > div.ui.container.mc-profile > div:nth-child(1) > div > div.tablet.only.mobile.only.center.aligned.sixteen.wide.mobile.column > div:nth-child(1) > div.mc-profile__contact-container > div > div.computer.only.column > button")

                const email = await page.evaluate(() => {
                    let email1 = document.querySelector("body > div.ui.bottom.left.wide.flowing.popup.transition.visible.mc-contact-popup > div > div > div > div > div > span.mc-contact-info__detail")
                    let email2 = document.querySelector("body > div.ui.bottom.left.wide.flowing.popup.transition.visible.mc-contact-popup > div > div > div:nth-child(2) > div > div > span.mc-contact-info__detail")
                    if (email2 == null) return Promise.resolve(email1.textContent)
                    else return Promise.resolve(email2.textContent)
                })
                csvData['email'] = email

                if (csvData !== "Name Not Found") {
                    csvString = `${csvData['firstName']}, ${csvData['lastName']}, ${csvData['email']}, ${csvData['company']}, ${csvData['companyLink']}, ${csvData['handle']}, ${csvData['program']}, ${csvData['title']}\n`
                    personData += csvString
                    console.log(`Results Scraped for: ${person}`)
                }
            } catch (err) {
                console.log(err)
            }
            
        }
        await fs.writeFile(`CSV2/list${i}.csv`, personData, (err) => {
            console.log(err)
        })
    }

}

async function scrapePeople() {
    const browser = await login()
    const personPage = await browser.newPage()

    await personPage.setRequestInterception(true)
    personPage.on('request', (req) => {
        if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
            req.abort()
        }
        else {
            req.continue()
        }
    })
    await loopListData(personPage)
}

void (async () => {
    //await loopEntries("json/roles.json")
    await scrapePeople()
})()