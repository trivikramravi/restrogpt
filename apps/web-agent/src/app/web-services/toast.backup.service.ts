import { Injectable } from '@nestjs/common';
import { OrderRequestDto } from '../dtos/order-request.dto';
import { chromium } from 'playwright';
import { Logger } from '@nestjs/common';
import { ElementHandle } from 'puppeteer';


@Injectable()
export class ToastService {
    async placeOrder(orderDetails: OrderRequestDto[]) {
        try{
        let url = "https://order.toasttab.com/online/flintridge-pizza-kitchen"
        const browser = await chromium.launch({
            headless: true
        })
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(url)
        await page.waitForTimeout(5000);
        Logger.log("page loaded")
        //await page.waitForSelector('.navWrapper', {state: "visible", timeout: 50000 })
        await page.waitForSelector('.diningOptionBehavior', {state: "visible", timeout: 50000 })
        await page.waitForSelector('.diningOptionAnchor', {state: "visible", timeout: 50000 })
        Logger.log("the pick up header has loaded")
        await page.click('.diningOptionAnchor')
        await page.waitForSelector('.diningOptionsContent', { state: 'visible', timeout: 100000 })
        await page.waitForTimeout(1000);

        await page.click('#diningOptionSubmit')

        Logger.log("update the pickup time")

        for (let orderDetail of orderDetails) {
            for (let item of orderDetail.itemDetails) {
                await page.waitForSelector('.ooSearch', { timeout: 100000 })
                await page.fill('.ooSearch input[type="text"]', `${item.name}`);
                // const searchInput = await page.$('.ooSearch input[type="text"]',{ timeout: 100000 });

                //   await searchInput.fill(`${item.name}`);

                // Click on the search button
                await page.waitForSelector('.searchIcon');
                const searchButton = await page.$('.searchIcon');
                await searchButton.click();
                Logger.log("the searched")

                await page.waitForTimeout(2000);

                await page.waitForSelector('.clickable');
                // Click on the ul
                await page.click('.clickable a');

                Logger.log("item selected")


                await page.waitForSelector('[aria-labelledby="menu-item-modal-header"]');

                if (item.Addons.toppings.length > 0) {
                    for (const topping of item.Addons.toppings) {
                        await page.waitForSelector(`div.name:has-text("${topping}")`);
                        const selector = `div.name:has-text("${topping}")`;
                        await page.click(selector);
                        Logger.log(`the toppings selected is ${topping}`)
                    }
                }

                await page.waitForSelector('.addToCart', { state: "visible", timeout: 50000 });
                if (item.qty > 1) {

                    for (let i = 1; i < item.qty; i++) {
                        await page.waitForSelector('[data-testid="inc-button"]', { state: "visible" });

                        // Click on the increment button
                        await page.click('[data-testid="inc-button"]');
                    }
                }

                await page.waitForTimeout(1000);
                await page.waitForSelector('.modalButton[data-testid="menu-item-cart-cta"]');
                await page.click('.modalButton[data-testid="menu-item-cart-cta"]')

                await page.waitForTimeout(1000);
                await page.waitForSelector('.cartContent');
                await page.waitForTimeout(5000);

            }
            await page.waitForSelector('.checkoutButton[data-testid="cart-checkout-cta"]');
            await page.click('.checkoutButton[data-testid="cart-checkout-cta"]')
            Logger.log("product added to cart and checkout done")

            //checkout page
            await page.waitForSelector('.checkoutForm')
            await page.waitForSelector('[data-testid="guestCheckoutButton"]')
            await page.click('[data-testid="guestCheckoutButton"]')

            //await page.waitForSelector('.CreditCardForm__wrapper___Fd5DW',{ visible: true, timeout: 60000 })

            // Wait for the iframe to be available
            await page.waitForSelector('iframe[title="creditCardForm"]', { state: "visible", timeout: 5000 });

            await page.waitForTimeout(2000);// Get the iframe element handle
            const iframeHandle = await page.$('iframe[title="creditCardForm"]');

            // Switch to the iframe context
            const cardFrame = await iframeHandle.contentFrame();

            // Now you can interact with elements inside the iframe
            if (cardFrame) {
                // For example, you can fill the credit card number input field
                await cardFrame.waitForSelector('[data-testid="credit-card-number"]');
                //await cardFrame.waitForSelector('.yourInfoContainer[data-testid="input-yourInfoPhone"]', { visible: true, timeout: 60000 });

                await cardFrame.fill('[data-testid="credit-card-number"]', '4242424242424242');

                // Fill other fields similarly
                await cardFrame.fill('[data-testid="credit-card-exp"]', '04/25');
                await cardFrame.fill('[data-testid="credit-card-cvv"]', '123');
                await cardFrame.fill('[data-testid="credit-card-zip"]', '12345');

                Logger.log("Payment details filled");
                Logger.log("person detials filled success");
            } else {
                console.error('Failed to switch to iframe context');
                throw Error("iframe not found ")
            }

            await page.waitForSelector('[data-testid="customer-info-inputs-animated-section"]', { state: "visible", timeout: 50000 });


            await page.fill('[data-testid="input-yourInfoPhone"]', `${orderDetail.customerDetails.phoneNo}`); // Fill phone number
            await page.fill('[data-testid="input-yourInfoEmail"]', `${orderDetail.customerDetails.email}`); // Fill email
            await page.fill('[data-testid="input-yourInfoFirstName"]', `${orderDetail.customerDetails.firstName}`); // Fill first name
            await page.fill('[data-testid="input-yourInfoLastName"]', `${orderDetail.customerDetails.lastName}`); // Fill last name

            await page.waitForTimeout(2000)

            Logger.log("success");
        }
        await browser.close();

        return "order placed succssfully"
    }catch(error){
        Logger.error(`error in toast service ${error.message}`)
        return error.message
    }


    }
}