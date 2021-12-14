const fs = require('fs');
const jsoncsv = require('json-csv')
const webdriver = require('selenium-webdriver');
const safari = require('selenium-webdriver/chrome');
const sleep = require("sleep");

async function runTest(){
  let driver = new webdriver.Builder()
      .forBrowser('safari')
      .build();
  const UNIVERSITIES = fs.readFileSync('universities.txt').toString().split("\n").filter((el)=>{
    return el.length> 0
  })


  const finalList = [];
  const failedList = [];
  for (var i = 0; i < UNIVERSITIES.length; i++){
    const uni =  UNIVERSITIES[i];
    let universityNumber = i+1;
    try {
      await driver.get(`https://www.google.com/search?q=${uni.split(" ").join("-")}+yocket+MS+Computer+science`)
      sleep.sleep(1);
      await driver.executeScript("document.querySelector('#search a').click()");
      sleep.sleep(1);
      const jsScript = `function getMeInfo() {
        const headingNodes = document.querySelectorAll(".statsHeading")
        let  credits;
        let  medium;
        let  duration;
        let  courseLink;
        let  tuitionLink;
        let  deadlineDetails;
        for (var node of headingNodes) {
          let nodeText = node && node.innerText
          if(nodeText){
            if(nodeText.match(/Annual Tuition Fee/g)) {
              annualTuition = node.parentElement.innerText
            }
            else if(nodeText.match(/Course Duration/g)) {
              duration = node.parentElement.innerText
            }
            else if(nodeText.match(/Course Credits/g)) {
              credits = node.parentElement.innerText
            }
            else if(nodeText.match(/Delivery Medium/g)) {
              medium = node.parentElement.innerText
            }
            else if(nodeText.match(/Course Link/g)) {
              courseLink =  node.parentElement.getElementsByTagName("a")[0].href
            }
            else if(nodeText.match(/Tuition Link/g)) {
              tuitionLink =  node.parentElement.getElementsByTagName("a")[0].href
            }
            else if(nodeText.match(/Fall/g)) {
              deadlineDetails = node.parentElement.innerText
            }
          }
        }
        return { credits, duration, annualTuition, medium, courseLink, tuitionLink, deadlineDetails};
      } 
      return getMeInfo();`
  
      const { credits, duration, annualTuition, medium, courseLink, tuitionLink, deadlineDetails} = await driver.executeScript(jsScript)
      let title = await driver.getTitle();
      let yocketUrl = await driver.getCurrentUrl();
      const info = {uni, universityNumber, credits,  duration,  annualTuition,  medium,  courseLink,  tuitionLink,  deadlineDetails, title, yocketUrl}
      Object.keys(info).forEach((key)=>{
        info[key] = String(info[key]).split("\n").join(" . ")
        info[key]
      })
      console.log(`${info.universityNumber}\t\t ${info.uni}\t\t ${info.deadlineDetails}`);
      finalList.push(info);
      
    } catch (err) {
      console.log("FAILED FOR UNIVERISTY " + UNIVERSITIES[i])
      failedList.push({
            universityNumber: i+1,
            name: UNIVERSITIES[i]
          }
        );
      const info = {uni, universityNumber, credits: "",  duration: "",  annualTuition: "",  medium: "",  courseLink: "",  tuitionLink: "",  deadlineDetails: "FAILED", title: "", yocketUrl: ""}
      finalList.push(info);
    }
  }
  let options = {
    fields: [
      {
        name: 'universityNumber',
        label: 'S.No.',
      },
      {
        name: 'uni',
        label: 'University',
        quoted: true,
      },
      {
        name: 'duration',
        label: 'Degree Duration',
      },
      {
        name: 'annualTuition',
        label: 'Annual Tuition',
      },
      {
        name: 'medium',
        label: 'Medium',
      },
      {
        name: 'courseLink',
        label: 'Course Link',
      },
      {
        name: 'tuitionLink',
        label: 'Tuition Link',
      },
      {
        name: 'deadlineDetails',
        label: 'Deadline Details',
      },
      {
        name: 'title',
        label: 'Title',
      },
      {
        name: 'yocketUrl',
        label: 'Yocket URL',
      },
    ],
  }
  
  let csv = await jsoncsv.buffered(finalList, options) 
  fs.writeFileSync(`./output/output-univs_${Date.now()}.csv` , csv);  
  await driver.quit();
}
runTest();