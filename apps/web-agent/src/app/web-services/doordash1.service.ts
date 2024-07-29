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
//const puppeteer = require('puppeteer');
//const antibotbrowser = require("antibotbrowser");
const solveCaptcha = require('../utills/solveCaptcha');
const puppeteer = require('puppeteer-extra');
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(stealthPlugin());




@Injectable()
export class DoordashService {
    private readonly logger: Logger = new Logger(DoordashService.name)
    constructor(private readonly mailService: MailService,
        private readonly orderTransactionService: OrderTransactionService,
        private readonly orderLineItemsService: OrderLineItemsService,
        private readonly errorLogService: ErrorLogService,
        private readonly orderLineItemsPlaced: OrderPlacedLineItemsService
    ) { }
    async placeOrder(orderDetail: OrderDto) {

        orderDetail.user_first_name = process.env.default == "1" ? process.env.firstName : orderDetail.user_first_name
        orderDetail.user_last_name = process.env.default == "1" ? process.env.lastName : orderDetail.user_last_name
        orderDetail.user_email = process.env.default == "1" ? process.env.customerEmail : orderDetail.user_email

        // await this.updateDb(orderDetail)
        let orderStatus = "success"
        let attempts = 0;
        const maxAttempts = 3;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));



        // while (attempts < maxAttempts) {
        let url = process.env.DOORDASHURL;
        // const antibrowser = await antibotbrowser.startbrowser();  

        // const browser = await puppeteer.connect({browserWSEndpoint: antibrowser.websokcet});
    
       // Normal use from now on
        //const page = await browser.newPage();    
        let browser = await puppeteer.launch({ headless: false, ignoreDefaultArgs: ["--enable-automation"] })
        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1400, height: 850 });
            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
                //'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
              );

            await page.goto(url)
            await page.waitForNetworkIdle();
            let siteKey = "0x4AAAAAAADnPIDROrmt1Wwj"
            const captchaSolution = await solveCaptcha(siteKey, url);
            this.logger.log("site launched")
            let startTime = new Date().getTime();
            await new Promise(resolve => setTimeout(resolve, 5000));
            this.logger.log(`waiting for website to load: ${new Date().getTime() - startTime} ms`)
            await page.waitForSelector('button.styles__ButtonRoot-sc-1nqx07s-0.ixDTkG');

            // Click the button
            await page.click('button.styles__ButtonRoot-sc-1nqx07s-0.ixDTkG');

            // Optionally, verify that the checkbox is checked
            //   const isChecked = await page.$eval('div[role="alert"] .cb-lb input[type="checkbox"]', el => el.checked);
            //   console.log('Checkbox checked:', isChecked);

            /****************** Updating pickup time ***********************/

            /*
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
           

            
            }
            */
        } catch (error) {
            this.logger.error(`the error in doordash order is ${error.message}`)
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

    async updateDb(orderDetail) {
        try {
            let orderInDb = await this.orderTransactionService.findOne({ order_id: orderDetail.resto_id })
            if (!orderInDb) {
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
        } catch (error) {
            this.logger.error(`error in updating order details to db ${error.message}`)
        }
    }
}