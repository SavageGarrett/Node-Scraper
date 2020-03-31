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

    // Loop through people
    for (let i = 78043; i < 85000; i++) {
      // Create Directory Page
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

      // Go to person page
      try{
        await directoryPage.goto(link + i,{
          waitUntil: "networkidle0"
        })
      } catch (err) {
        console.log(err)
        i--;
        continue;
      }


      // Scrape Page
      let error = 0
      let result
      try {
        result = await directoryPage.evaluate(() => {
          // Get Name
          let name = document.querySelector("div:nth-child(1) > div.ui.container.mc-profile > div:nth-child(1) > div > div.computer.only.nine.wide.computer.column > div > h2")
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
      } catch (err) {
        error = 1
      }

      // Scrape Email
      let csvString;
      if (result !== "Name Not Found" && error == 0) {
        const clickResponse = await directoryPage.click("#root > div:nth-child(1) > div.ui.container.mc-profile > div:nth-child(1) > div > div.tablet.only.mobile.only.center.aligned.sixteen.wide.mobile.column > div:nth-child(1) > div.mc-profile__contact-container > div > div.computer.only.column > button")

        const email = await directoryPage.evaluate(() => {
          let email1 = document.querySelector("body > div.ui.bottom.left.wide.flowing.popup.transition.visible.mc-contact-popup > div > div > div > div > div > span.mc-contact-info__detail")
          let email2 = document.querySelector("body > div.ui.bottom.left.wide.flowing.popup.transition.visible.mc-contact-popup > div > div > div:nth-child(2) > div > div > span.mc-contact-info__detail")
          if (email2 == null) return Promise.resolve(email1.textContent)
          else return Promise.resolve(email2.textContent)
        })
        result['email'] = email

        csvString = `${result['firstName']}, ${result['lastName']}, ${result['email']}, ${result['company']}, ${result['companyLink']}, ${result['handle']}, ${result['program']}, ${result['title']}\n`
        console.log(csvString)
      } else {
        console.log('Name Not Found')
      }

      fullCSV += csvString
      
      console.log(`Result Number ${i}`)
      await directoryPage.close()
    }

    //write out result variable
    await fs.writeFile(`CSV/result1_${Date.now()}.csv`, fullCSV, (err) => {
      console.log(err)
    })
    console.log('Result Written To File')

    // Close Login Page
    await page.close()

    //await browser.close()
  } catch (error) {
    console.log(error)
  }
})()