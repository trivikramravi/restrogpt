import { Injectable, Logger } from '@nestjs/common';
import { OrderDto } from '../dtos/order.dto';
import { CartOrderItemDto } from '../dtos/response/cartData';
import { OrderResponseDto } from '../dtos/response/orderResponse';
import { OrderDataDto } from '../dtos/response/orderData';
import { MailService } from '../utills/mail-service';
import { OrderTransactionService } from '../dbservices/orderDetials.service';
import { ItemDto } from '../dtos/item.dto';
import { OrderLineItemsService } from '../dbservices/orderLineItems.service';
import { ErrorLogService } from '../dbservices/errorLog.service';
import { OrderPlacedLineItemsService } from '../dbservices/orderPlaced.service';
import { OtpService } from '../utills/otpReader';
const puppeteer = require('puppeteer');
const antibotbrowser = require("antibotbrowser");


@Injectable()
export class UberService {
    private readonly logger: Logger = new Logger(UberService.name)
    constructor(private readonly mailService: MailService,
        private readonly orderTransactionService: OrderTransactionService,
        private readonly orderLineItemsService: OrderLineItemsService,
        private readonly errorLogService: ErrorLogService,
        private readonly orderLineItemsPlaced: OrderPlacedLineItemsService,
        private readonly otpService:OtpService
    ) { }
    async placeOrder(orderDetail: OrderDto) {

        orderDetail.user_first_name = process.env.default == "1" ? process.env.firstName : orderDetail.user_first_name
        orderDetail.user_last_name = process.env.default == "1" ? process.env.lastName : orderDetail.user_last_name
        orderDetail.user_email =  process.env.default == "1" ? process.env.customerEmail : orderDetail.user_email
        
        // await this.updateDb(orderDetail)
        let orderStatus = "success"
        let attempts = 0;
        const maxAttempts = 3;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        

      // while (attempts < maxAttempts) {
            let url = process.env.UBERURL;
            const browser = await puppeteer.launch({ headless: false })
 
            try {
                const page = await browser.newPage();
                await page.setViewport({ width: 1400, height: 600 });
                // Set a user agent to avoid being detected as a bot
                await page.setUserAgent(process.env.USER_AGENT);

                this.logger.log("Launch the site")
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 })
                this.logger.log("site launched")
                let startTime = new Date().getTime();
                await new Promise(resolve => setTimeout(resolve, 20000));
                this.logger.log(`waiting for website to load: ${new Date().getTime() - startTime} ms`)
                  // Scroll to the top of the page
                await page.evaluate(() => {
                window.scrollTo(0, 0);
                });

                console.log('Scrolled to the top of the page');

                /****************** Updating pickup time ***********************/
                await page.waitForSelector('.be.bf.bg.bh.ea.eb.ec.al.cg.ed.ee.ef.da.eg.bn.co.ds.b1');

                // Click the SVG element
                await page.click('.be.bf.bg.bh.ea.eb.ec.al.cg.ed.ee.ef.da.eg.bn.co.ds.b1');

                await page.waitForSelector('input[placeholder="Search for an address"]');
                

                // Focus on the input element
                const inputElement = await page.$('input[placeholder="Search for an address"]');
                await inputElement.click();

                // Type the address into the input field
                await inputElement.type('456 Foothill Boulevard');

                // Wait for a moment to ensure the search is triggered
                await new Promise(resolve => setTimeout(resolve, 2000));
              
                await page.waitForSelector('ul.cb.h5');

                // Evaluate in the context of the page to find and click the first <p> tag
                const clicked = await page.evaluate(() => {
                  // Find all <ul> elements with the specified class
                  const ulElements = Array.from(document.getElementsByTagName('ul'));
            
                  // Loop through each <ul> element to find the first matching <p> tag
                  for (let ulElement of ulElements) {
                    if (ulElement.classList.contains('cb') && ulElement.classList.contains('h5')) {
                      // Find all <p> elements inside this <ul> element
                      const pElements = Array.from(ulElement.getElementsByTagName('p'));
            
                      // Loop through each <p> element to find the one with text "456 Foothill Boulevard"
                      for (let pElement of pElements) {
                        if (pElement.textContent.trim() === '456 Foothill Boulevard') {
                          // Click the <p> element if found
                          pElement.click();
                          return true; // Return true to indicate click success
                        }
                      }
                    }
                  }
            
                  return false; // Return false if no <p> tag was clicked
                });
            
                if (clicked) {
                  this.logger.log('Clicked on the first <p> tag with text "456 Foothill Boulevard"');
                } else {
                  this.logger.log('Failed to click on the first <p> tag with text "456 Foothill Boulevard"');
                }
                
                  this.logger.log('First <p> tag with text "456 Foothill Boulevard" clicked.');
                
                await new Promise(resolve => setTimeout(resolve, 3000));

                await page.waitForSelector('span[data-testid="rich-text"]');

                // Click the button containing the text "Cancel"
             
                await page.evaluate(() => {
                  const buttons = Array.from(document.querySelectorAll('button')); // Get all button elements
                  for (let button of buttons) {
                    const span = button.querySelector('span[data-testid="rich-text"]');
                    if (span && span.textContent.includes('Cancel')) {
                      (button as HTMLElement).click();
                      break;
                    }
                  }
                },);

                this.logger.log('the cancel button is clicked to close the pop up of shedule')

                await new Promise(resolve => setTimeout(resolve, 3000));

                await page.waitForSelector('div[data-testid="delivery-address-label"]', { visible: true, timeout: 60000 });

                // Evaluate in the context of the page to find and click the <div> element
                const result = await page.evaluate(() => {
                  const elements = Array.from(document.querySelectorAll('div[data-testid="delivery-address-label"]'));
                  for (const element of elements) {
                    if (element.textContent.includes('Map location')) {
                      (element as HTMLElement).click();
                      return true; // Return true if the element is found and clicked
                    }
                  }
                  return false; // Return false if no matching element is found
                });
            
                if (result) {
                  this.logger.log('Clicked on the <div> element with text "Map location"');
                } else {
                  this.logger.log('Failed to find and click on the <div> element with text "Map location"');
                }

    await new Promise(resolve => setTimeout(resolve, 3000));

  

    await page.waitForSelector('a[data-testid="schedule-button"]');

  // Click on the Schedule link
  await page.click('a[data-testid="schedule-button"]');

  await new Promise(resolve => setTimeout(resolve, 3000));

  await page.waitForSelector('select[aria-label="Select delivery date"]');

  // Convert the input date format to match the dropdown options
  const inputDate = orderDetail.order_date; // This is the input date
  const inputDateObj = new Date(`2024-${inputDate.split(', ')[1].replace('/', '-')}`); // Convert to a Date object
  const optionsFormat = inputDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); // Format to match dropdown

  // Select the option that matches the converted date
  await page.evaluate((optionsFormat) => {
    const selectElement = document.querySelector('select[aria-label="Select delivery date"]') as HTMLSelectElement;
    const options = Array.from(selectElement.options);
    for (let option of options) {
      if (option.text.includes(optionsFormat)) {
        selectElement.value = option.value;
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  }, optionsFormat);
  this.logger.log(`the date  ${orderDetail.order_date} is selected`)

  await new Promise(resolve => setTimeout(resolve, 5000));
  //this.timeConversionAndSelection(document)
  await page.waitForSelector('button[aria-label="Save scheduled delivery preference"]');

  // Click the button
  await page.click('button[aria-label="Save scheduled delivery preference"]');
  await new Promise(resolve => setTimeout(resolve, 3000));
                
                let failedItems: ItemDto[] = []
                for (let item of orderDetail.items) {
                    let failedItem = new ItemDto()
                    await page.waitForSelector('input[placeholder="Search in Flintridge Pizza Kitchen"]', { state: 'visible', timeout: 60000 });
                    await page.click('input[placeholder="Search in Flintridge Pizza Kitchen"]');

                    // Select all text in the input field
                    await page.keyboard.down('Control');
                    await page.keyboard.press('A');
                    await page.keyboard.up('Control');

                    // Delete the selected text
                    await page.keyboard.press('Backspace');
                    const itemSearch = await page.$('input[placeholder="Search in Flintridge Pizza Kitchen"]');
                    //await itemSearch.click();

                // Type the address into the input field
                    await itemSearch.type(item.name);
                    //await page.type('input[placeholder="Search in Flintridge Pizza Kitchen"]', item.name);
                    this.logger.log(`the require item ${item.name} is searched`)
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    await page.waitForSelector('a.al.e8.d5.da.oh.oi.oj'); // Adjust this selector to match the link you want to target

  // Click the list item containing the text "14\" BBQ Chicken Pizza"

  await page.evaluate((product) => {
    const items = Array.from(document.querySelectorAll('a.al.e8.d5.da.oh.oi.oj')); // Adjust this selector to match the link you want to target
    for (let item of items) {
      const span = item.querySelector('span[data-testid="rich-text"]');
      if (span && (span as HTMLElement).textContent.includes(product)) {
        (item as HTMLElement).click();
        break;
      }
    }
  }, item.name);

  this.logger.log('the item is clicked')

  await new Promise(resolve => setTimeout(resolve, 3000));

  await page.waitForFunction((toppings) =>
    toppings.every(topping => Array.from(document.querySelectorAll('label')).some(label => label.textContent.includes(topping))),
    {}, item.toppings
  );

  await new Promise(resolve => setTimeout(resolve, 1000));
  // Find the label element by its text content and click it
  for(let topping of item.toppings) {
    await page.evaluate((topping) => {
        const labels = Array.from(document.querySelectorAll('label'));
        const toppingLabel = labels.find(label => label.textContent.includes(topping));
        if (toppingLabel) {
          toppingLabel.click();
        } else {
          console.error(`Topping label not found: ${topping}`);
        }
      }, topping);

  this.logger.log(`the topping ${topping} is checked `)
  await new Promise(resolve => setTimeout(resolve, 1000));
  }

  await page.waitForSelector('div[data-testid="quantity-selector"] select', { visible: true });

  // Click on the dropdown to display the options
  await page.click('div[data-testid="quantity-selector"] select');

  // Optionally, wait for options to be available if needed
  await new Promise(resolve => setTimeout(resolve, 1000)); // Adjust this if necessary

  // Select the desired quantity (e.g., 10)
  await page.evaluate((quantity) => {
    const selectElement = document.querySelector('div[data-testid="quantity-selector"] select') as HTMLSelectElement;
    selectElement.value = quantity;
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
  }, `${item.quantity}00000`); // Replace with the appropriate value

  console.log(`Quantity changed to ${item.quantity}`);

  const buttonSelector = `button[aria-label="Add ${item.quantity} to order"]`;

  // Wait for the button to be visible
  await page.waitForSelector(buttonSelector, { visible: true });

  // Click the button
  await page.click(buttonSelector);

  console.log(`Clicked on the "Add ${item.quantity} to order" button`);

//   await page.waitForFunction(() => 
//     Array.from(document.querySelectorAll('button')).some(button => button.getAttribute('aria-label').includes('Add ') && button.getAttribute('aria-label').includes(' to order'))
//   );

//   // Click the button
//   await page.evaluate(() => {
//     const buttons = Array.from(document.querySelectorAll('button'));
//     const addButton = buttons.find(button => button.getAttribute('aria-label').includes('Add ') && button.getAttribute('aria-label').includes(' to order'));
//     if (addButton) {
//       addButton.click();
//     } else {
//       console.error('Add to order button not found');
//     }
//   });

//   console.log('Add to order button clicked');
await page.waitForSelector('div.nf button[data-testid="close-button"]', { visible: true });

  // Click the close button
  await page.click('div.nf button[data-testid="close-button"]');

  console.log('Clicked on the close button');  
  await new Promise(resolve => setTimeout(resolve, 1000));                 
}

await page.waitForSelector('div.ce button[aria-label="checkout"]', { visible: true });

  // Click the cart button
  await page.click('div.ce button[aria-label="checkout"]');

  console.log('Clicked on the cart button');
  
  await new Promise(resolve => setTimeout(resolve, 1000));

await page.waitForSelector('a[data-testid="go-to-checkout-button"]', { visible: true });

  // Click the checkout button
  await page.click('a[data-testid="go-to-checkout-button"]');

  console.log('Clicked on the "Go to checkout" button');

  const email = 'ssnobody8@gmail.com'; // Replace with the dynamic email address

  // Wait for the email input field to be visible
  await page.waitForSelector('#PHONE_NUMBER_or_EMAIL_ADDRESS', { visible: true });
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Enter the dynamic email address into the input field
  await page.type('#PHONE_NUMBER_or_EMAIL_ADDRESS', email);

  console.log('Entered the email address');

  await page.waitForSelector('#forward-button', { visible: true });

  // Click on the "Continue" button
  await page.click('#forward-button');

  console.log('Clicked the "Continue" button');

  let otp = await this.otpService.getOTPFromEmail()
                
            } catch (error) {
                this.logger.error(`the error in uber order is ${error.message}`)
                /*if (attempts === maxAttempts) {
                   this.logger.error(`Order placement failed after ${maxAttempts} attempts: ${error.message}`);
                    this.logger.error(`Error in ToastService is: ${error.message}`);
                    await browser.close();
                    let errorData = {
                        "resto_id": orderDetail.resto_id,
                        "error": {
                            "message": error.message,
                            "status": "failed"
                        },
                        "toast_id": "NA",
                        "code": 500
                    }
                    await browser.close();
                    await this.orderTransactionService.updateOrderTransaction({order_id:orderDetail.resto_id}, { response: JSON.stringify(errorData),isorderplaced:false,orderstatus:"failed",ispaymentfailed:true,order_placed_at:`${new Date()}`});
                    return errorData;

                    //return { status: "Failed", error: error.message };
                } else {
                    this.logger.error(`Order placement attempt ${attempts} failed: ${error.message}. Retrying...`);
                    let errorLog = {
                        order_id: orderDetail.resto_id,
                        reason: "the order is not placed due to an error",
                        error_log: error.message,
                        order_by: "Roma-P"
                    }
                    await this.errorLogService.createOrderTransaction(errorLog)
                    await this.orderTransactionService.updateOrderTransaction({order_id:orderDetail.resto_id},{retry_count:attempts})
                    await browser.close()
                    await delay(5000); // Optional: delay before retrying
                } */
            }
       // }
    }

    

// Convert the order time to a Date object
timeConversionAndSelection(){
    const orderTime = "12:15 PM GMT+5:30";

    // Convert the order time to a Date object
    const orderDate = new Date(orderTime);
    
    // Calculate the start and end times in minutes since midnight
    const minutesSinceMidnight = orderDate.getHours() * 60 + orderDate.getMinutes();
    const startTime = minutesSinceMidnight;
    const endTime = minutesSinceMidnight + 30;
    
    // Format the values as required by the select options
    const formattedStartTime = Math.floor(startTime / 15) * 15;
    const formattedEndTime = formattedStartTime + 30;
    const startTimeMs = orderDate.setMinutes(orderDate.getMinutes() - orderDate.getTimezoneOffset()) + (formattedStartTime * 60 * 1000);
    
    // Construct the value to match the select options
    const selectValue = JSON.stringify({
      startTime: formattedStartTime,
      startTimeMs: startTimeMs,
      endTime: formattedEndTime,
    });
    
    // Select the relevant option
    const selectElement = document.querySelector('select[aria-label="Select delivery time"]') as HTMLSelectElement;
    if (selectElement) {
      const optionToSelect = Array.from(selectElement.options).find(option => option.value === selectValue);
      if (optionToSelect) {
        selectElement.value = optionToSelect.value;
        const event = new Event('change', { bubbles: true });
        selectElement.dispatchEvent(event);
      } else {
        console.error('No matching option found');
      }
    } else {
      console.error('Select element not found');
    }
    
}
    formatDate(date: Date): string {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}-${month}-${year} ${hours}:${minutes}`;
    }

    async selectTheSearchedProduct(page, itemName) {
        try {
            await page.waitForSelector('span.headerText');

            // Find the span with the specific text and click it
            await page.evaluate((value) => {
                const spans = document.querySelectorAll('span.headerText');
                for (let span in spans) {
                    if (spans[span].textContent.trim() === value) {
                        const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
                        spans[span].dispatchEvent(event);
                        break;
                    }
                };
            }, itemName);

            // Log the action
            this.logger.log(`Clicked on the span with text ${itemName}`);
            this.logger.log("Item selected");
            return true
        } catch (error) {
            this.logger.error(`the error while selecting the product is ${error.message}`)
            this.logger.log(`the searched item ${itemName} was not found`)
            return false
        }
    }

    async selectdateDropdownOption(type, page, optionText, dropDown, dropOptions) {
        try {
            // Click to open the dropdown
            await page.waitForSelector(dropDown, { state: "visible", timeout: 60000 });
            await page.click(dropDown);

            // Wait for the dropdown content to be visible
            //await page.waitForSelector('div[data-testid="dropdown-content"]:not(.hide)');

            // Select the dropdown option by finding the element with the text
            const dateFound = await page.evaluate((optionText, dropOptions) => {
                const options = document.querySelectorAll(dropOptions);
                let found = false;

                options.forEach(option => {
                    if (option.textContent.includes(optionText)) {
                        const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
                        option.dispatchEvent(event);
                        found = true;
                    }
                });

                return found;
            }, optionText, dropOptions);

            if (!dateFound) {
                throw new Error(`The ${optionText} is not found in the ${type} dropdown`);
            }
            return { status: true, error: null }
        } catch (error) {
            this.logger.error(`Error selecting ${type} from dropdown: ${error.message}`);
            return { status: false, error: error };
        }
    }


    async selectTimeFromDropdown(page, time) {
        try {
            const dropdowns = await page.$$('div.dropDown.withBorder');

            // Iterate through each dropdown
            for (const dropdown of dropdowns) {
                // Get the label text of the dropdown
                const labelText = await dropdown.$eval('.dropDownLabel', label => label.textContent);

                // Check if the label contains "GMT"
                if (labelText.includes("GMT") || labelText == "ASAP") {
                    // Click to open the dropdown
                    await dropdown.click();

                    // Wait for the dropdown content to be visible
                    await page.waitForSelector('[data-testid="fulfillment-time-selector"]');

                    let dateFound = await page.evaluate((optionText) => {
                        const options = document.querySelectorAll('div[data-testid="dropdown-option"]');
                        let found = false;
                        function findClosestTime(time, options) {
                            // Convert time string to Date object
                            function convertToDate(timeStr) {
                                const [time, period, timezone] = timeStr.split(' ');
                                const [hours, minutes] = time.split(':');
                                const isPM = period === 'PM' && hours !== '12';
                                const date = new Date();
                                date.setHours(isPM ? parseInt(hours, 10) + 12 : parseInt(hours, 10));
                                date.setMinutes(parseInt(minutes, 10));
                                return date;
                            }

                            const givenTime = convertToDate(time);

                            // Helper function to get time difference in minutes
                            function getTimeDifference(date1, date2) {
                                return Math.abs((date1 - date2) / (1000 * 60));
                            }

                            let closestTime = null;
                            let minDifference = Infinity;

                            for (const option of options) {
                                const optionTime = convertToDate(option);
                                const difference = getTimeDifference(givenTime, optionTime);

                                if (difference <= 30) {
                                    minDifference = difference;
                                    closestTime = option;
                                }
                            }

                            return closestTime;
                        }

                        options.forEach(option => {
                            if (option.textContent.includes(optionText)) {
                                const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
                                option.dispatchEvent(event);
                                found = true;
                            }
                        });
                        if (!found) {
                            options.forEach(option => {
                                let closetTime = findClosestTime(optionText, Array.from(options).map(option => option.textContent))
                                if (option.textContent.includes(closetTime)) {
                                    const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
                                    option.dispatchEvent(event);
                                    found = true;
                                }
                            })
                        }

                        return { status: found, options: Array.from(options).map(option => option.textContent) };
                    }, time);

                    this.logger.log(`The time picker result: ${JSON.stringify(dateFound)}`);

                    if (!dateFound.status) {
                        throw new Error(`The ${time} is not found in the time dropdown`);
                    }
                }
            }
            return { status: true, error: null };
        } catch (error) {
            this.logger.error(`Error in selecting time from dropdown: ${error.message}`);
            return { status: false, error: error };
        }
    }

    getRequiredToppings(finalItems, requestedItems, failedItems) {
        // Extract names from finalItems and failedItems
        try {
            this.logger.log(`the finalItems are ${JSON.stringify(finalItems)}, the requiredItems`)
            let finalItemNames
            if (finalItems.length > 0 && finalItems[0].name != undefined) {
                finalItemNames = new Set(finalItems.map(item => item.name));
            } else {
                finalItemNames = []
            }
            let failedItemNames
            if (failedItems.length > 0 && failedItems[0].name != undefined) {
                failedItemNames = new Set(failedItems.map(item => item.name));
            } else {
                failedItemNames = []
            }
            // Initialize requiredToppings
            const requiredToppings = [];

            // Iterate over requestTimes and find names not in finalItems or failedItems
            requestedItems.forEach(item => {
                if (!finalItemNames.has(item.name) && !failedItemNames.has(item.name)) {
                    requiredToppings.push(item.name);
                }
            });

            return requiredToppings;
        } catch (error) {
            this.logger.log(`The error in getRequiredToppings is ${error.message}`)
            return [];
        }
    }

    async updateDb(orderDetail){
        try{
            let orderInDb = await this.orderTransactionService.findOne({ order_id: orderDetail.resto_id })
            if(!orderInDb){
            let orderDetails = {
                order_id: orderDetail.resto_id,
                request: JSON.stringify(orderDetail),
                orderplacedby: "Roma-P",
                orderstatus: "inProgress",
                customer_email: orderDetail.user_email,
                customer_first_name: orderDetail.user_first_name,
                customer_Last_name: orderDetail.user_last_name,
                customer_phone: orderDetail.user_phone,
                customer_comment: orderDetail.user_pickup_comment,
                pickup_date: orderDetail.order_date,
                pickup_time: orderDetail.order_time
                
            }
            await this.orderTransactionService.createOrderTransaction(orderDetails)
        }
            for (let itemDetails of orderDetail.items) {
                let orderItemInfo = {
                    order_id: orderDetail.resto_id,
                    item: itemDetails.name,
                    topping: JSON.stringify(itemDetails.toppings_quantities),
                    quantity: itemDetails.quantity
                }
                await this.orderLineItemsService.createOrderTransaction(orderItemInfo)
            }
        }catch(error){
            this.logger.error(`error in updating order details to db ${error.message}`)
        }
    }
}