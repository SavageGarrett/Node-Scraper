const puppeteer = require('puppeteer')
const fs = require('fs')

const email = "garrettcarder@gmail.com"
const pass = "Gcard200"

//61978 - 78596
let personNum = 61978
let link = "https://accelerate.masschallenge.org/people/"

void (async () => {
  try {
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

    // CSV Header
    let fullCSV = 'First Name, Last Name, Email Address, Company Name, Company Domain, Linkedin Handle, MassChallenge Program, Title\n'

    // Read JSON link file
    let data = fs.readFileSync('json/pages3.json')
    data = JSON.parse(data)

    // JSON Header
    let fullJSON = "{\n"
    
    // Loop through every JSON link entry
    for (link in data) {
        let numPages = Math.ceil(data[link] / 24)
        let page = 1

        // Loop through pages for each entry
        while (page <= numPages) {
            const directoryPage = await browser.newPage()

            // Intercept Costly Requests
            await directoryPage.setRequestInterception(true)
            directoryPage.on('request', (req) => {
                if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
                    req.abort()
                }
                else {
                    req.continue()
                }
            })

            // Go to directory page
            await directoryPage.goto(link + page,{
                waitUntil: "networkidle0"
            })

            await directoryPage.evaluate(() => {
                let numChildren = document.querySelector("#root > div:nth-child(1) > div.ais-InstantSearch__root > div > div:nth-child(2) > div").childElementCount;
                console.log(numChildren)
                for (let i = 1; i <= numChildren; i++) {
                    let person = document.querySelector("#root > div:nth-child(1) > div.ais-InstantSearch__root > div > div:nth-child(2) > div > div:nth-child(1) > div:nth-child(1) > div > div.mc-card__meta > a")
                    if (person != null) {
                        fullJSON += `\t"${person.href}" : 0,\n`
                    }
                }
            }).catch((err) => {
                console.log(err)
            })

            // Increment Page Number
            page++
            await directoryPage.close()
        }
    }

    fullJSON += '}'

    fs.writeFile('json/people.json', fullJSON, (err) => {
        if (err) console.log(err)
        else console.log('File Written!')
    })

    // Close Login Page
    await page.close()

    //await browser.close()
  } catch (error) {
    console.log(error)
  }
})()