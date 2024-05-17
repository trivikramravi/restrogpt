import { Injectable } from '@nestjs/common';
import { OrderRequestDto } from '../dtos/order-request.dto';
import { chromium } from 'playwright';
import { Logger } from '@nestjs/common';

@Injectable()
export class FlintridgeService {
    async placeOrder(orderDetails: OrderRequestDto[]) {
        try{
        const browser = await chromium.launch({
            headless: true
        })
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto("https://flintridgepizzakitchen.com/home")

        await page.waitForTimeout(2000);
        await page.waitForSelector('.collapse.navbar-collapse', { state: "visible", timeout: 60000 });

        // Wait for the Order Online link to be visible within the navbarCollapse element
        await page.waitForSelector('.collapse.navbar-collapse a[href="https://flintridgepizzakitchen.com/order"]', { state: "visible", timeout: 60000 });

        // Click on the Order Online link
        await page.click('.collapse.navbar-collapse a[href="https://flintridgepizzakitchen.com/order"]');



        await page.waitForSelector('label[for="switch_right-2"]');

        // Click on the "Pickup" label
        await page.click('label[for="switch_right-2"]');

        Logger.log("Clicked on the 'Pickup' label.");

        // Wait for the group with class "group-4" to appear
        await page.waitForSelector('.group-4');


        // Click on the radio button for "Schedule for later"
        await page.click('input[value="sch_ordr"] + span');
        /*
        //selecting date and time 
        let date = 'Wed, May 01';
        let time = '11:30 pm';
        const dateElements = await page.evaluate(() => {
            // Use querySelectorAll to fetch all child elements of the div
            const dateDiv = document.querySelector('#selDeldt');
            // Return an array of text content of child elements
            return Array.from(dateDiv.children).map(child => child.textContent);
        });
        
        Logger.log(dateElements);
    
        const timeElements = await page.evaluate(() => {
            // Use querySelectorAll to fetch all child elements of the div
            const timeDiv = document.querySelector('#selDeldh');
            // Return an array of text content of child elements
            return Array.from(timeDiv.children).map(child => child.textContent);
        });
        Logger.log(timeElements);
        */


        await page.waitForSelector(".sch_btn_box");
        Logger.log("start order loaded")

        await page.waitForSelector('#delitime');

        // Click on the "Start order" button with id "delitime"
        await page.click('#delitime');
        for (let orderDetail of orderDetails) {

            // Click on the "Add" button for "Big Slice"
            for (let item of orderDetail.itemDetails) {
                await page.waitForSelector(`//h3[contains(text(), '${item.name}')]`);

                await page.click(`//h3[contains(text(), '${item.name}')]`);

                await page.waitForSelector('.other-content-box');

                if (item.Addons.toppings.length > 0) {
                    for (const topping of item.Addons.toppings) {
                        await page.waitForSelector(`label:has-text("${topping}")`);
                        await page.click(`label:has-text("${topping}")`);
                        Logger.log(`The topping ${topping} is added`);
                    }
                }

                if (item.qty > 1) {
                    for (let i = 1; i < item.qty; i++) {
                        await page.waitForSelector('.qtySelector');
                        const qtyContainer = await page.$('.qtySelector');
                        let countElement = await qtyContainer.$('.qtyValue');
                        let count = await countElement.getAttribute('value');
                        Logger.log('the count is :', count);
                        await page.click('.increaseQty');
                        countElement = await qtyContainer.$('.qtyValue');
                        count = await countElement.getAttribute('value');
                        Logger.log('updated Count:', count);
                    }
                }
                await page.waitForSelector('.btns-sec');
                await page.click('.adcrt');
            }


            await page.waitForSelector('.order-lg-last')
            await page.click('.checkout-btn');

            //checkout page 
            await page.waitForSelector('.form-group')
            orderDetail.customerDetails.firstName
            await page.fill('#name', `${orderDetail.customerDetails.firstName} ${orderDetail.customerDetails.lastName}`);
            await page.fill('#phone', orderDetail.customerDetails.phoneNo);
            await page.fill('#email', orderDetail.customerDetails.email);
            Logger.log('the user details are updated')

            await page.waitForSelector('.tip')
            await page.click('.no_tip');
            await page.click('.checkout-btn')

            await page.waitForSelector('.resp_msg', { timeout: 100000 });
            Logger.log("otp screen loaded")

            await page.fill('#verify_cd', "123456");
            Logger.log("otp entered")

            await page.waitForSelector('.modal-body-top button:has-text("Submit")', { state: "visible" });
            await page.click('.modal-body-top button:has-text("Submit")');

            await page.waitForSelector('#payment-form', { state: "visible", timeout: 50000 });
            Logger.log("payment page loaded")
            // Get the iframe element

            const iframeSelector = 'iframe[name^="__privateStripeFrame"]'; // Adjust the selector to match any iframe name starting with "__privateStripeFrame"
            await page.waitForSelector(iframeSelector, { state: "visible", timeout: 60000 });

            // Get the iframe element handle
            const iframeElementHandle = await page.$(iframeSelector);

            if (!iframeElementHandle) {
                console.error('Failed to find iframe element');
                return;
            }

            // Switch to the iframe context
            const iframe = await iframeElementHandle.contentFrame();

            if (!iframe) {
                console.error('Failed to switch to iframe context');
                return;
            }

            // Now you can interact with elements inside the iframe
            await iframe.fill('#Field-numberInput', '4242424242424242');
            await iframe.fill('#Field-expiryInput', '04/25');
            await iframe.fill('#Field-cvcInput', '424');
            Logger.log("payment details filled")
            // await page.click('#submit');

            await page.waitForTimeout(5000)
        }
            await browser.close();

            return "order placed succssfully"
        }catch(error){
            Logger.error(`error in flintridge service ${error.message}`)
            return error.message
        }
        
    }
}