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
const puppeteer = require('puppeteer');


@Injectable()
export class ToastService {
    private readonly logger: Logger = new Logger(ToastService.name)
    constructor(private readonly mailService: MailService,
        private readonly orderTransactionService: OrderTransactionService,
        private readonly orderLineItemsService: OrderLineItemsService,
        private readonly errorLogService: ErrorLogService,
        private readonly orderLineItemsPlaced: OrderPlacedLineItemsService
    ) { }
    async placeOrder(orderDetail: OrderDto) {

        await this.updateDb(orderDetail)
        let orderStatus = "success"
        // let attempts = 0;
        // const maxAttempts = 3;
        // const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // while (attempts < maxAttempts) {
            let url = process.env.TOASTURL;
            const browser = await puppeteer.launch({ headless: false })
            try {
                const page = await browser.newPage();
                await page.setViewport({ width: 1400, height: 850 });
                // Set a user agent to avoid being detected as a bot
                const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36";
                await page.setUserAgent(ua);

                this.logger.log("Launch the site")
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 })
                this.logger.log("site launched")
                await new Promise(resolve => setTimeout(resolve, 2000));

                /****************** Updating pickup time ***********************/
                await page.waitForSelector('[data-testid="primary-cta-oo-options-btn"]', { timeout: 120000 });
                await page.click('[data-testid="primary-cta-oo-options-btn"]');

                await page.waitForSelector('[data-testid="diningOptionSubmit"]', { state: 'visible', timeout: 120000 });
                await new Promise(resolve => setTimeout(resolve, 2000));

                let dateResponse = await this.selectdateDropdownOption("date", page, orderDetail.order_date, '[data-testid="fulfillment-date-selector"]', '[data-testid="fulfillment-date-list-option"]');
                if (!dateResponse.status) {
                    let errorLog = {
                        order_id: orderDetail.resto_id,
                        reason: `the pickup date ${orderDetail.order_date} was not found`,
                        error_log: dateResponse.error.message,
                        order_by: "Roma-P"
                    }
                    await this.errorLogService.createOrderTransaction(errorLog)
                    throw Error(`${dateResponse.error.message}`)
                }
                this.logger.log(`Dropdown option date '${orderDetail.order_date}' selected`);

                await new Promise(resolve => setTimeout(resolve, 2000));


                // Call the function to select the time from the dropdown
                //let timeResponse = await this.selectdateDropdownOption("time",page, orderDetail.order_time,'[data-testid="fulfillment-time-selector"]','[data-testid="dropdown-option"]');
                let timeResponse = await this.selectTimeFromDropdown(page, orderDetail.order_time);
                if (!timeResponse.status) {
                    let errorLog = {
                        order_id: orderDetail.resto_id,
                        reason: `the pickup time ${orderDetail.order_time} was not found`,
                        error_log: timeResponse.error.message,
                        order_by: "Roma-P"
                    }
                    await this.errorLogService.createOrderTransaction(errorLog)
                    throw Error(`${timeResponse.error.message}`)
                }
                this.logger.log(`Dropdown option time ${orderDetail.order_time} selected`);

                await new Promise(resolve => setTimeout(resolve, 2000));

                await page.waitForSelector('[data-testid="diningOptionSubmit"]', { state: 'visible', timeout: 120000 });
                await page.click('[data-testid="diningOptionSubmit"]');
                await new Promise(resolve => setTimeout(resolve, 2000));

                this.logger.log("Pickup time updated");
                let failedItems: ItemDto[] = []
                for (let item of orderDetail.items) {
                    let failedItem = new ItemDto()
                    await page.waitForSelector('input[placeholder="Search"]', { state: 'visible', timeout: 60000 });
                    await page.click('input[placeholder="Search"]');

                    // Select all text in the input field
                    await page.keyboard.down('Control');
                    await page.keyboard.press('A');
                    await page.keyboard.up('Control');

                    // Delete the selected text
                    await page.keyboard.press('Backspace');
                    await page.type('input[placeholder="Search"]', item.name);
                    this.logger.log(`the require item ${item.name} is searched`)
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    let itemSelection = await this.selectTheSearchedProduct(page, item.name)
                    if (!itemSelection) {
                        this.logger.log("the toppings are skipped as the product itself was not found")
                        failedItem.name = item.name
                        failedItems.push(failedItem)
                        if (orderDetail.items.length > failedItems.length) {
                            let errorLog = {
                                order_id: orderDetail.resto_id,
                                reason: `the ordered item ${item.name} was not found`,
                                error_log: "item not found",
                                order_by: "Roma-P"
                            }
                            await this.errorLogService.createOrderTransaction(errorLog)
                            orderStatus = "partial-successful"
                            continue
                        } else {
                            this.logger.log(`the given item ${item.name} is not found when searched`)
                            await this.mailService.sendMail(`missing Items in order ${orderDetail.resto_id}`, failedItems)
                            let errorLog = {
                                order_id: orderDetail.resto_id,
                                reason: `the ordered item ${item.name} was not found`,
                                error_log: "item not found",
                                order_by: "Roma-P"
                            }
                            await this.errorLogService.createOrderTransaction(errorLog)
                            throw Error(`the ordered item ${item.name} was not found`)
                        }
                    }

                    if (item.toppings.length > 0) {
                        for (const topping of item.toppings) {
                            // Wait for the selector to appear within the timeout period
                            await page.waitForSelector('div.name', { timeout: 120000 });

                            // Click the element that contains the topping text
                            try {
                                await page.evaluate((topping) => {
                                    const elements = Array.from(document.querySelectorAll('div.name'));
                                    const element = elements.find(el => el.textContent.trim() === topping);

                                    if (element) {
                                        (element as HTMLElement).click();
                                    } else {
                                        throw Error(`the topping ${topping} is not found`)
                                    }
                                }, topping);

                                this.logger.log(`Topping selected: ${topping}`);
                            } catch (error) {
                                this.logger.error(`the error while finding the topping was ${error.message}`)
                                failedItem.name = item.name
                                failedItem.toppings.push(topping)
                                orderStatus = "partial-successful"
                                continue
                            }
                            if (item.toppings_quantities[topping] && item.toppings_quantities[topping] > 1) {
                                const quantity = item.toppings_quantities[topping];
                                for (let i = 1; i < quantity; i++) {
                                    await page.evaluate((topping) => {
                                        const elements = Array.from(document.querySelectorAll('div.name'));
                                        const element = elements.find(el => el.textContent.trim() === topping);

                                        if (element) {
                                            const parent = element.closest('.toggleContents');
                                            if (parent) {
                                                const incButton = parent.querySelector('[data-testid="inc-button"]');
                                                if (incButton) {
                                                    (incButton as HTMLElement).click();
                                                } else {
                                                    throw new Error(`Increment button for topping ${topping} is not found`);
                                                }
                                            } else {
                                                throw new Error(`Parent container for topping ${topping} is not found`);
                                            }
                                        } else {
                                            throw new Error(`The topping ${topping} is not found`);
                                        }
                                    }, topping);
                                }
                            }
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        }

                    }

                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await page.waitForSelector('.addToCart', { state: "visible", timeout: 10000 });
                    this.logger.log("Add to cart");
                    if (item.quantity > 1) {
                        for (let i = 1; i < item.quantity; i++) {
                            await page.waitForSelector('.addToCart [data-testid="inc-button"]', { state: "visible", timeout: 120000 });
                            await page.click('.addToCart [data-testid="inc-button"]');
                            this.logger.log("the quantity has incresed ")
                        }
                    }

                    await new Promise(resolve => setTimeout(resolve, 5000));
                    await page.waitForSelector('[data-testid="menu-item-cart-cta"]', { state: "visible", timeout: 10000 });
                    await page.click('[data-testid="menu-item-cart-cta"]');
                    this.logger.log("add to cart done")
                    await page.waitForSelector('[data-testid="modal-close-button"]', { state: "visible", timeout: 10000 });
                    await page.click('[data-testid="modal-close-button"]');
                    this.logger.log("closed cart")

                    await new Promise(resolve => setTimeout(resolve, 2000));
                    if (failedItem.name != undefined || failedItem.name != null) {
                        failedItems.push(failedItem)
                    }
                }

                await page.waitForSelector('.targetAction', { timeout: 10000 });
                await page.click('.targetAction')
                await new Promise(resolve => setTimeout(resolve, 2000));

                //await page.click('a[href="/online/flintridge-pizza-kitchen/checkout"]')
                try {
                    await page.waitForSelector('[data-testid="cart-checkout-cta"]', { state: "visible", timeout: 60000 })
                    await page.click('[data-testid="cart-checkout-cta"]')
                    await page.reload()
                } catch (error) {
                    const itemWithMissingRequiredToppings = this.getRequiredToppings([], orderDetail.items, failedItems);
                    if (failedItems.length > 0 || itemWithMissingRequiredToppings.length > 0) {
                        await this.mailService.sendMail(`missing Items in order ${orderDetail.resto_id}`, failedItems, itemWithMissingRequiredToppings)
                    }
                    throw Error(error.message)
                }
                // Log success
                this.logger.log("Product added to cart and checkout initiated");

                await new Promise(resolve => setTimeout(resolve, 2000));
                if (orderDetail.is_vehicle) {
                    await page.waitForSelector('[data-testid="curbside-pickup-section"]', { state: "visible", timeout: 10000 });
                    //await new Promise(resolve => setTimeout(resolve, 2000));
                    //await page.waitForSelector('[data-testid="curbsidePickupCheckbox"]', { state: "visible",timeout: 10000 });
                    await page.click('[data-testid="curbside-pickup-section"]');

                    await page.waitForSelector('[data-testid="input-curbsidePickupVehicle"]', { timeout: 10000 });
                    await page.type('[data-testid="input-curbsidePickupVehicle"]', `${orderDetail.car_number}`);
                    await page.type('[data-testid="input-curbsidePickupVehicleColor"]', `${orderDetail.car_color}`);
                    this.logger.log("car details entered")
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
                if (orderDetail.promo) {
                    await page.waitForSelector('[data-testid="input-promoCode"]', { timeout: 10000 });
                    await page.type('[data-testid="input-promoCode"]', `${orderDetail.promo_code}`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await page.waitForSelector('[data-testid="apply-promoCode"]', { timeout: 10000 })
                    await page.click('[data-testid="apply-promoCode"]')
                    this.logger.log("the promo code is applied")
                }

                // Optionally, interact with the guest checkout button

                await page.waitForSelector('[data-testid="guestCheckoutButton"]', { timeout: 20000 });
                await page.click('[data-testid="guestCheckoutButton"]');

                await page.waitForSelector('iframe[title="creditCardForm"]', { state: "visible", timeout: 10000 });
                await new Promise(resolve => setTimeout(resolve, 2000));
                const iframeHandle = await page.$('iframe[title="creditCardForm"]');
                const cardFrame = await iframeHandle.contentFrame();

                if (cardFrame) {
                    await cardFrame.waitForSelector('[data-testid="credit-card-number"]', { timeout: 10000 });
                    await cardFrame.type('[data-testid="credit-card-number"]', process.env.CARD_NUMBER);
                    await cardFrame.type('[data-testid="credit-card-exp"]', process.env.CARD_EXPIRE_DATE);
                    await cardFrame.type('[data-testid="credit-card-cvv"]', process.env.CARD_CVV);
                    await cardFrame.type('[data-testid="credit-card-zip"]', process.env.CARD_ZIPCODE);
                    this.logger.log("Payment details typed");
                } else {
                    throw new Error("Failed to switch to iframe context");
                }

                await page.waitForSelector('[data-testid="customer-info-inputs-animated-section"]', { state: "visible", timeout: 10000 });
                await page.type('[data-testid="input-yourInfoPhone"]', `${orderDetail.user_phone}`);
                await page.type('[data-testid="input-yourInfoEmail"]', `${orderDetail.user_email}`);
                await page.type('[data-testid="input-yourInfoFirstName"]', `${orderDetail.user_first_name}`);
                await page.type('[data-testid="input-yourInfoLastName"]', `${orderDetail.user_last_name}`);


                this.logger.log("Customer details typed successfully");
                await new Promise(resolve => setTimeout(resolve, 2000));
                let buttonText = "Other"
                const selector = `button.tipButton`;

                // Wait for the buttons to become visible
                await page.waitForSelector(selector, { state: "visible", timeout: 100000 });

                // Get all buttons with the class 'tipButton'
                const buttons = await page.$$(selector);

                // Iterate over the buttons and find the one with the desired text content
                for (const button of buttons) {
                    const text = await button.evaluate(node => node.textContent.trim());
                    if (text === buttonText) {
                        // Click the button
                        await button.click();
                        break;// Exit the loop after clicking the button
                    }
                }

                await page.waitForSelector('[data-testid="input-custom-tip-amount"]', { state: "visible", timeout: 10000 });
                await page.type('[data-testid="input-custom-tip-amount"]', "0");
                this.logger.log("the tip is added")
                await new Promise(resolve => setTimeout(resolve, 2000));

                await page.waitForSelector('[data-testid="basicSubmitButton"]', { state: "visible", timeout: 10000 });
                await page.click('[data-testid="basicSubmitButton"]');
                this.logger.log("the place order is clicked successfully")
                await new Promise(resolve => setTimeout(resolve, 5000));

                const currentPageUrl = page.url();
                this.logger.log(`Current page URL: ${currentPageUrl}`);
                if (currentPageUrl == "https://order.toasttab.com/online/flintridge-pizza-kitchen/confirm") {
                    await page.reload()
                }
                //await page.waitForSelector('.checkoutErrorModalContent',{ state: "visible", timeout: 50000 })
                await page.waitForSelector('[data-testid="orderItem"]', { state: "visible", timeout: 100000 });

                const email = await page.$eval('.fixedSection div:first-child', element => {
                    return element ? element.textContent.trim() : '';
                });

                const subtotal = await page.$eval('[data-testid="Subtotal-item-test-id"] [data-testid="item-price-amount"]', span => {
                    return span ? span.textContent.trim().replace('$', '') : '';
                });

                const discount = await page.$eval('[data-testid="Discounts-item-test-id"] [data-testid="item-price-amount"]', span => {
                    return span ? span.textContent.trim().replace('$', '') : '';
                });

                // const dateAndTime = await page.$eval('.sectionRow', div => {
                //     const text = div.textContent.trim();
                //     return text.replace('Your order will be ready', '').trim();
                // });



                const orderData = await page.evaluate(() => {
                    const extractInnerText = (selector) => {
                        const element = document.querySelector(selector);
                        return element ? element.textContent.trim() : '';
                    };

                    const extractOrderItems = () => {
                        const items = [];
                        document.querySelectorAll('[data-testid="orderItem"]').forEach(orderItemElement => {
                            const name = orderItemElement.querySelector('.name')?.textContent?.trim() || '';
                            const quantity = orderItemElement.querySelector('.quantity')?.textContent?.trim() || '';
                            const price = orderItemElement.querySelector('[data-testid="price"]')?.textContent?.trim() || '';

                            const mods = Array.from(orderItemElement.querySelectorAll('.mod')).map(mod => mod.textContent.trim());
                            const modifications = mods.filter(mod => mod !== '');
                            const toppingsObj = {};
                            modifications.forEach(topping => {
          const match = topping.match(/^(\d*)(.*)$/);
          const quantity = match[1] ? parseInt(match[1], 10) : 1;
          const name = match[2].trim();
          toppingsObj[name] = quantity;
        });
                            // const mods = Array.from(orderItemElement.querySelectorAll('.mod')).map(mod => {
                            //     const modNameElement = mod.childNodes[0];
                            //     const modName = modNameElement && modNameElement.nodeType === Node.TEXT_NODE ? modNameElement.textContent.trim() : modNameElement ? modNameElement.nodeValue.trim() : '';
                            //     const modQuantityElement = mod.querySelector('.quantity');
                            //     const modQuantity = modQuantityElement ? parseInt(modQuantityElement.textContent.trim(), 10) : 1;
                            //     return { modName, modQuantity };
                            // });
                    
                            // const modifications = mods.reduce((acc, { modName, modQuantity }) => {
                            //     if (modName) {
                            //         acc[modName] = modQuantity;
                            //     }
                            //     return acc;
                            // }, {});
                    
                            items.push({ name, quantity, price, toppings: toppingsObj });
                        });
                        return items;
                    };

                    return {
                        orderItems: extractOrderItems(),
                        total: extractInnerText('.cart-flex-row .totalPrice:last-child'),
                        orderNumber: extractInnerText('.checkoutSectionHeader .checkNumber'),
                        orderTime: extractInnerText('.sectionRow .icon[alt="Order time"] + *')
                    };
                });

                this.logger.log(orderData);
                let currentDate = new Date()
                let orderResponse = new OrderResponseDto();
                let orderDataDto = new OrderDataDto();
                let cartOrderItem = new CartOrderItemDto();

                orderDataDto.cart_order_items = orderData.orderItems
                orderDataDto.discounts = discount
                orderDataDto.subtotal = subtotal
                orderDataDto.order_total = "0"
                orderDataDto.order_id = orderData.orderNumber
                orderDataDto.receipt_email = email
                orderDataDto.roma_order_datetime = this.formatDate(currentDate)
                // orderDataDto.

                orderResponse.data = orderDataDto
                orderResponse.message = `${orderDetail.resto_id} Order Place Successful with this Order ${orderData.orderNumber}`
                orderResponse.resto_id = orderDetail.resto_id
                orderResponse.toast_id = orderData.orderNumber
                orderResponse.status = "success"
                this.logger.log(`the response returned for place order is ${JSON.stringify(orderResponse)}`)
                for (let orderedItem of orderData.orderItems){
                    let placedItems = {
                        order_id:orderDetail.resto_id,
                        item:orderedItem.name,
                        topping: JSON.stringify(orderedItem.toppings),
                        quantity:orderedItem.quantity,
                        price:orderedItem.price
                    }
                    await this.orderLineItemsPlaced.createOrderTransaction(placedItems)
                }
                await this.orderTransactionService.updateOrderTransaction({ order_id: orderResponse.resto_id }, { response: JSON.stringify(orderResponse),isorderplaced:true,orderstatus:orderStatus,ispaymentfailed:false,discount:discount,subtotal:subtotal,transaction_id:orderData.orderNumber,order_placed_at:`${new Date()}`})  
                const itemWithMissingRequiredToppings = this.getRequiredToppings(orderData.orderItems, orderDetail.items, failedItems);
                if ((failedItems.length > 0 && failedItems[0].name == ``) || itemWithMissingRequiredToppings.length > 0) {
                    await this.mailService.sendMail(`missing Items in order ${orderDetail.resto_id}`, failedItems, itemWithMissingRequiredToppings)
                }
                //await browser.close();

                return orderResponse

            } catch (error) {
                //if (attempts === maxAttempts) {
                   // this.logger.error(`Order placement failed after ${maxAttempts} attempts: ${error.message}`);
                    //this.logger.error(`Error in ToastService is: ${error.message}`);
                    //await browser.close();
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
                // } else {
                //     this.logger.error(`Order placement attempt ${attempts} failed: ${error.message}. Retrying...`);
                //     let errorLog = {
                //         order_id: orderDetail.resto_id,
                //         reason: "the order is not placed due to an error",
                //         error_log: error.message,
                //         order_by: "Roma-P"
                //     }
                //     await this.errorLogService.createOrderTransaction(errorLog)
                //     await this.orderTransactionService.updateOrderTransaction({order_id:orderDetail.resto_id},{retry_count:attempts})
                //     await delay(5000); // Optional: delay before retrying
                // }
            }
        }
    //}

    formatDate(date: Date): string {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}-${month}-${year} ${hours}:${minutes}`;
    }

    convertToppings(toppings:any) {
        const toppingsObj = {};
        toppings.forEach(topping => {
          const match = topping.match(/^(\d*)(.*)$/);
          const quantity = match[1] ? parseInt(match[1], 10) : 1;
          const name = match[2].trim();
          toppingsObj[name] = quantity;
        });
        return toppingsObj;
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