import { Injectable, Logger } from '@nestjs/common';
import { OrderDto } from '../dtos/order.dto';
import { CartOrderItemDto } from '../dtos/response/cartData';
import { OrderResponseDto } from '../dtos/response/orderResponse';
import { OrderDataDto } from '../dtos/response/orderData';
const puppeteer = require('puppeteer');


@Injectable()
export class ToastService {
    private readonly logger: Logger = new Logger(ToastService.name)
    async placeOrder(orderDetail: OrderDto) {
        let url = process.env.TOASTURL;
        const browser = await puppeteer.launch({ headless: false })
        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1400, height: 850 });
            // Set a user agent to avoid being detected as a bot
            const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36";
            await page.setUserAgent(ua);

            this.logger.log("Launch the site")
            await page.goto(url, { waitUntil: 'networkidle2' })
            this.logger.log("site launched")
            await new Promise(resolve => setTimeout(resolve, 1000));

            /****************** Updating pickup time ***********************/
            await page.waitForSelector('[data-testid="primary-cta-oo-options-btn"]', { timeout: 120000 });
            await page.click('[data-testid="primary-cta-oo-options-btn"]');

            await page.waitForSelector('[data-testid="diningOptionSubmit"]', { state: 'visible', timeout: 120000 });
            await new Promise(resolve => setTimeout(resolve, 2000));

            let dateResponse = await this.selectdateDropdownOption("date",page, orderDetail.order_date,'[data-testid="fulfillment-date-selector"]','[data-testid="fulfillment-date-list-option"]');
            if (!dateResponse.status) {
                throw Error(`${dateResponse.error.message}`)
            }
            this.logger.log(`Dropdown option date '${orderDetail.order_date}' selected`);

            await new Promise(resolve => setTimeout(resolve, 2000));


            // Call the function to select the time from the dropdown
            //let timeResponse = await this.selectdateDropdownOption("time",page, orderDetail.order_time,'[data-testid="fulfillment-time-selector"]','[data-testid="dropdown-option"]');
            let timeResponse = await this.selectTimeFromDropdown(page, orderDetail.order_time);
            if (!timeResponse.status) {
                throw Error(`${timeResponse.error.message}`)
            }
            this.logger.log(`Dropdown option time ${orderDetail.order_time} selected`);

            await new Promise(resolve => setTimeout(resolve, 2000));

            await page.waitForSelector('[data-testid="diningOptionSubmit"]', { state: 'visible', timeout: 120000 });
            await page.click('[data-testid="diningOptionSubmit"]');
            await new Promise(resolve => setTimeout(resolve, 2000));

            this.logger.log("Pickup time updated");

            for (let item of orderDetail.items) {

                await page.waitForSelector('input[placeholder="Search"]', { visible: true, timeout: 60000 });
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
                }, item.name);

                // Log the action
                this.logger.log(`Clicked on the span with text ${item.name}`);
                this.logger.log("Item selected");

                if (item.toppings.length > 0) {
                    for (const topping of item.toppings) {

                        const selector = `div.name`;
                        // Wait for the selector to appear within the timeout period
                        await page.waitForSelector(selector, { timeout: 120000 });

                        // Click the element that contains the topping text
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
                        if (item.toppings_quantities[topping]) {
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
                await page.waitForSelector('[data-testid="menu-item-cart-cta"]', { timeout: 10000 });
                await page.click('[data-testid="menu-item-cart-cta"]');
                this.logger.log("add to cart done")
                await page.waitForSelector('[data-testid="modal-close-button"]', { timeout: 10000 });
                await page.click('[data-testid="modal-close-button"]');
                this.logger.log("closed cart ")

                await new Promise(resolve => setTimeout(resolve, 2000));

            }

            await page.waitForSelector('.targetAction', { timeout: 10000 });
            await page.click('.targetAction')
            await new Promise(resolve => setTimeout(resolve, 2000));

            //await page.click('a[href="/online/flintridge-pizza-kitchen/checkout"]')
            await page.waitForSelector('[data-testid="cart-checkout-cta"]', { timeout: 10000 })
            await page.click('[data-testid="cart-checkout-cta"]')
            await page.reload()
            // Log success
            this.logger.log("Product added to cart and checkout initiated");

            await new Promise(resolve => setTimeout(resolve, 2000));
            if (orderDetail.is_vehicle) {
                await page.waitForSelector('.checkoutSection', { timeout: 10000 });
                await new Promise(resolve => setTimeout(resolve, 2000));
                await page.click('.curbsideText');

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

            const dateAndTime = await page.$eval('.sectionRow', div => {
                const text = div.textContent.trim();
                return text.replace('Your order will be ready', '').trim();
            });

            

            const orderData = await page.evaluate((subtotal,email,discount) => {
                const extractInnerText = (selector) => {
                    const element = document.querySelector(selector);
                    return element ? element.textContent.trim() : '';
                };
            
                const extractEmail = (selector) => {
                    const element = document.querySelector(selector);
                    return element ? element.textContent.trim():'';
                };

                const extractOrderItems = () => {
                    const items = [];
                    document.querySelectorAll('[data-testid="orderItem"]').forEach(orderItemElement => {
                        const name = orderItemElement.querySelector('.name')?.textContent?.trim() || '';
                        const quantity = orderItemElement.querySelector('.quantity')?.textContent?.trim() || '';
                        const price = orderItemElement.querySelector('[data-testid="price"]')?.textContent?.trim() || '';
            
                        // const mods = Array.from(orderItemElement.querySelectorAll('.mod')).map(mod => mod.textContent.trim());
                        // const modifications = mods.filter(mod => mod !== '');
            
                        items.push({ name, quantity, price });
                    });
                    return items;
                };

               
            
                return {
                    orderItems: extractOrderItems(),
                    total: extractInnerText('.cart-flex-row .totalPrice:last-child'),
                    orderNumber: extractInnerText('.checkoutSectionHeader .checkNumber'),
                    orderTime: extractInnerText('.sectionRow .icon[alt="Order time"] + *')
                };
            },subtotal,email,discount);
            
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
            return orderResponse
    
            //await browser.close();

            //return "Order placed successfully";

        } catch (error) {
            //await page.screenshot({ path: 'error_screenshot.png' });
            Logger.error(`Error in ToastService is: ${error.message}`);
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
            return errorData;
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

    async selectdateDropdownOption(type,page,optionText, dropDown, dropOptions) {
        try {
            // Click to open the dropdown
            await page.waitForSelector(dropDown, { state: "visible", timeout: 60000 });
            await page.click(dropDown);
            
            // Wait for the dropdown content to be visible
            //await page.waitForSelector('div[data-testid="dropdown-content"]:not(.hide)');

            // Select the dropdown option by finding the element with the text
            const dateFound = await page.evaluate((optionText,dropOptions) => {
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
            }, optionText,dropOptions);

            if (!dateFound) {
                throw new Error(`The ${optionText} is not found in the ${type} dropdown`);
            }
            return { status: true, error: null }
        } catch (error) {
            Logger.error(`Error selecting ${type} from dropdown: ${error.message}`);
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
                    //await page.waitForSelector('div[data-testid="dropdown-content"]:not(.hide)');
                    await page.waitForSelector('[data-testid="fulfillment-time-selector"]');

                    const dateFound = await page.evaluate((optionText) => {
                        const options = document.querySelectorAll('div[data-testid="dropdown-option"]');
                        let found = false;

                        options.forEach(option => {
                            if (option.textContent.includes(optionText)) {
                                const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
                                option.dispatchEvent(event);
                                found = true;
                            }
                        });

                        return found;
                    }, time);
                    this.logger.log(`the time picker ${dateFound}`)
                    if (!dateFound) {
                        throw new Error(`The ${time} is not found in the time dropdown`);
                    }
                }
            }
            return { status: true, error: null }
        } catch (error) {
            Logger.error(`the error in selecting time from dropdowm ${error.message}`)
            return { status: false, error: error }
        }
    }
}
