import { Injectable, Logger } from '@nestjs/common';
import { OrderDto } from '../dtos/order.dto';
import { timeout } from 'rxjs';
const puppeteer = require('puppeteer');

@Injectable()
export class ToastService {
    async placeOrder(orderDetail: OrderDto) {
        let url = "https://order.toasttab.com/online/flintridge-pizza-kitchen";

        try {
            const browser = await puppeteer.launch({ headless: false })
            const page = await browser.newPage();
            await page.setViewport({ width: 1400, height: 850 });
            // Set a user agent to avoid being detected as a bot
            const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36";
            await page.setUserAgent(ua);

            Logger.log("Launch the site")
            await page.goto(url, { waitUntil: 'networkidle2' })
            Logger.log("site launched")
            await new Promise(resolve => setTimeout(resolve, 1000));

            await page.waitForSelector('[data-testid="primary-cta-oo-options-btn"]', { timeout: 120000 });
            await page.click('[data-testid="primary-cta-oo-options-btn"]');

            await page.waitForSelector('[data-testid="diningOptionSubmit"]', { state: 'visible', timeout: 120000 });
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Select the date 'Wed, 5/29'
            await selectDropdownOption(page, orderDetail.order_date);
            Logger.log(`Dropdown option date ${orderDetail.order_date} selected`);

            await new Promise(resolve => setTimeout(resolve, 2000));


            // Call the function to select the time from the dropdown
            await selectTimeFromDropdown(page, orderDetail.order_time);

            await page.waitForSelector('[data-testid="diningOptionSubmit"]', { state: 'visible', timeout: 120000 });
            await page.click('[data-testid="diningOptionSubmit"]');
            await new Promise(resolve => setTimeout(resolve, 2000));

            Logger.log("Pickup time updated");


            for (let item of orderDetail.items) {

                await page.waitForSelector('input[placeholder="Search"]', { visible: true, timeout: 60000 });
                await page.type('input[placeholder="Search"]', item.name);
                await new Promise(resolve => setTimeout(resolve, 2000));

                await page.waitForSelector('span.headerText');

                // Find the span with the specific text and click it
                await page.evaluate((value) => {
                    const spanText = value;
                    const spans = document.querySelectorAll('span.headerText');
                    spans.forEach(span => {
                        if (span.textContent.trim() === spanText) {
                            const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
                            span.dispatchEvent(event);
                        }
                    });
                }, item.name);

                // Log the action
                Logger.log(`Clicked on the span with text ${item.name}`);
                Logger.log("Item selected");

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
                            }
                        }, topping);

                        Logger.log(`Topping selected: ${topping}`);
                        if (item.toppings_quantities[topping]) {
                            const quantity = item.toppings_quantities[topping];
                            for (let i = 1; i < quantity; i++) {
                                await page.waitForSelector('[data-testid="inc-button"]', { state: "visible", timeout: 120000 });
                                await page.click('[data-testid="inc-button"]');
                                Logger.log(`The quantity has been incresed for topping ${topping}`);
                            }
                        }
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 2000));
                await page.waitForSelector('.addToCart', { state: "visible", timeout: 10000 });
                Logger.log("Add to cart");
                if (item.quantity > 1) {
                    for (let i = 1; i < item.quantity; i++) {
                        await page.waitForSelector('.addToCart [data-testid="inc-button"]', { state: "visible", timeout: 120000 });
                        await page.click('.addToCart [data-testid="inc-button"]');
                        Logger.log("the quantity has incresed ")
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 5000));
                await page.waitForSelector('[data-testid="menu-item-cart-cta"]', { timeout: 10000 });
                await page.click('[data-testid="menu-item-cart-cta"]');
                Logger.log("add to cart done")
                await page.waitForSelector('[data-testid="modal-close-button"]', { timeout: 10000 });
                await page.click('[data-testid="modal-close-button"]');
                Logger.log("closed cart ")

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
            Logger.log("Product added to cart and checkout initiated");

            await new Promise(resolve => setTimeout(resolve, 2000));
            if (orderDetail.is_vehicle) {
                await page.waitForSelector('.checkoutSection', { timeout: 10000 });
                await new Promise(resolve => setTimeout(resolve, 2000));
                await page.click('.curbsideText');

                await page.waitForSelector('[data-testid="input-curbsidePickupVehicle"]', { timeout: 10000 });
                await page.type('[data-testid="input-curbsidePickupVehicle"]', `${orderDetail.car_number}`);
                await page.type('[data-testid="input-curbsidePickupVehicleColor"]', `${orderDetail.car_color}`);
                Logger.log("car details entered")
            }
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Optionally, interact with the guest checkout button

            await page.waitForSelector('[data-testid="guestCheckoutButton"]', { timeout: 20000 });
            await page.click('[data-testid="guestCheckoutButton"]');

            await page.waitForSelector('iframe[title="creditCardForm"]', { state: "visible", timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 2000));
            const iframeHandle = await page.$('iframe[title="creditCardForm"]');
            const cardFrame = await iframeHandle.contentFrame();

            if (cardFrame) {
                await cardFrame.waitForSelector('[data-testid="credit-card-number"]', { timeout: 10000 });
                await cardFrame.type('[data-testid="credit-card-number"]', '4242424242424242');
                await cardFrame.type('[data-testid="credit-card-exp"]', '04/25');
                await cardFrame.type('[data-testid="credit-card-cvv"]', '123');
                await cardFrame.type('[data-testid="credit-card-zip"]', '12345');
                Logger.log("Payment details typed");
            } else {
                throw new Error("Failed to switch to iframe context");
            }

            await page.waitForSelector('[data-testid="customer-info-inputs-animated-section"]', { state: "visible", timeout: 10000 });
            await page.type('[data-testid="input-yourInfoPhone"]', `${orderDetail.user_phone}`);
            await page.type('[data-testid="input-yourInfoEmail"]', `${orderDetail.user_email}`);
            await page.type('[data-testid="input-yourInfoFirstName"]', `${orderDetail.user_first_name}`);
            await page.type('[data-testid="input-yourInfoLastName"]', `${orderDetail.user_last_name}`);


            Logger.log("Customer details typed successfully");
            await new Promise(resolve => setTimeout(resolve, 2000));
            let buttonText = "Other"
            const selector = `button.tipButton`;

    // Wait for the buttons to become visible
    await page.waitForSelector(selector, { state: "visible" ,timeout:100000});

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
    Logger.log("the tip is added")
            await new Promise(resolve => setTimeout(resolve, 5000));

            await browser.close();

            return "Order placed successfully";
        } catch (error) {
            //await page.screenshot({ path: 'error_screenshot.png' });
            Logger.error(`Error in ToastService: ${error.message}`);
            //await browser.close();
            return error.message;
        }
    }
}

async function selectDropdownOption(page, optionText) {
    // Click to open the dropdown
    await page.click('div[data-testid="dropdown-selector"]',);

    // Wait for the dropdown content to be visible
    await page.waitForSelector('div[data-testid="dropdown-content"]:not(.hide)');

    // Select the dropdown option by finding the element with the text
    await page.evaluate((optionText) => {
        const options = document.querySelectorAll('div[data-testid="dropdown-option"]');
        options.forEach(option => {
            if (option.textContent.includes(optionText)) {
                const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
                option.dispatchEvent(event);
            }
        });
    }, optionText);
}

async function selectTimeFromDropdown(page, time) {
    // Find all dropdowns

    const dropdowns = await page.$$('div.dropDown.withBorder');

    // Iterate through each dropdown
    for (const dropdown of dropdowns) {
        // Get the label text of the dropdown
        const labelText = await dropdown.$eval('.dropDownLabel', label => label.textContent);

        // Check if the label contains "GMT"
        if (labelText.includes("GMT")) {
            // Click to open the dropdown
            await dropdown.click();

            // Wait for the dropdown content to be visible
            await page.waitForSelector('div[data-testid="dropdown-content"]:not(.hide)');

            // Select the time '12:00 AM GMT+5:30'
            const options = await page.$$('div[data-testid="dropdown-option"]');
            for (const option of options) {
                const optionText = await option.evaluate(node => node.textContent);
                if (optionText.includes(time)) {
                    await option.click();
                    Logger.log(`Time selected: ${optionText}`);
                    return; // Exit the loop once the option is selected
                }
            }
        }
    }
}

