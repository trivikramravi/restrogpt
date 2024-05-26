import { Injectable, Logger } from '@nestjs/common';
import { chromium } from 'playwright';
import { OrderDto } from '../dtos/order.dto';

@Injectable()
export class ToastService {
    async placeOrder(orderDetails: OrderDto[]) {
       let url = "https://order.toasttab.com/online/flintridge-pizza-kitchen";
       
       try{
        const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36";
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
       // await page.setViewportSize({ width: 1200, height: 800 });
    
        // Set a user agent to avoid being detected as a bot
        
        //await page.setUserAgent(ua);
    
        Logger.log("Launch the site");
        await page.goto(url);
        await page.waitForTimeout(2000);
        Logger.log("site launched");

        //await waitUntilElement(page, '[nav-role="primary-cta"]', 100000);
            
        await page.waitForSelector('.navWrapper', {state: 'visible', timeout: 120000 });
        await page.click('.orderOptions');

            await page.waitForSelector('[data-testid="diningOptionSubmit"]', { state: 'visible', timeout: 120000 });
            await new Promise(resolve => setTimeout(resolve, 2000));

           
            for (let orderDetail of orderDetails) {
            //await page.click('div[data-testid="dropdown-selector"]');
            // await page.waitForSelector('div[data-testid="dropdown-content"]');
            // await page.click(`div[data-testid="dropdown-option"]:has-text(${orderDetail.order_date})`);
            // Logger.log(`Dropdown option ${orderDetail.order_date} selected`);

            await page.waitForSelector('[data-testid="diningOptionSubmit"]', { state: 'visible', timeout: 120000 });
            await page.click('[data-testid="diningOptionSubmit"]');
            Logger.log("Pickup time updated");

           
            
                for (let item of orderDetail.items) {
                    await page.waitForSelector('.searchBox', { timeout: 120000 });
                    await page.fill('.searchBox', `${item.name}`);

                    await new Promise(resolve => setTimeout(resolve, 2000));

                    await page.waitForSelector('.clickable', { timeout: 120000 });
                    await page.click('.clickable a');
                    Logger.log("Item selected");

                    await page.waitForSelector('[aria-labelledby="menu-item-modal-header"]', { timeout: 120000 });

                    if (item.toppings.length > 0) {
                        for (const topping of item.toppings) {
                            const selector = `div.name:has-text("${topping}")`;
                            await page.waitForSelector(selector, { timeout: 120000 });
                            await page.click(selector);
                            Logger.log(`Topping selected: ${topping}`);
                        }
                    }

                    await page.waitForSelector('.addToCart', { state: "visible", timeout: 120000 });
                    if (item.quantity > 1) {
                        for (let i = 1; i < item.quantity; i++) {
                            await page.waitForSelector('[data-testid="inc-button"]', { state: "visible", timeout: 120000 });
                            await page.click('[data-testid="inc-button"]');
                        }
                    }

                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await page.waitForSelector('.modalButton[data-testid="menu-item-cart-cta"]', { timeout: 120000 });
                    await page.click('.modalButton[data-testid="menu-item-cart-cta"]');
                    
                    await page.waitForSelector('.closeButton', { state: "visible", timeout: 120000 })
                    await page.click('.closeButton')
                }
                await new Promise(resolve => setTimeout(resolve, 2000));

                await page.waitForSelector('.targetAction', { timeout: 120000 });
                await page.click('.targetAction');
                
                await page.waitForSelector('.checkoutButton[data-testid="cart-checkout-cta"]', { timeout: 120000 });
                await page.click('.checkoutButton[data-testid="cart-checkout-cta"]');
                Logger.log("Product added to cart and checkout initiated");

                    if(orderDetail.is_vehicle){
                        await page.waitForSelector('.checkoutSection', { timeout: 120000 });
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await page.click('.curbsideText');
    
                        await page.waitForSelector('[data-testid="input-curbsidePickupVehicle"]', { timeout: 120000 });
                        await page.fill('[data-testid="input-curbsidePickupVehicle"]', `${orderDetail.car_number}`);
                        await page.fill('[data-testid="input-curbsidePickupVehicleColor"]', `${orderDetail.car_color}`);
                        Logger.log("car details entered")
                    }

                await page.waitForSelector('.checkoutForm', { timeout: 120000 });
                await page.waitForSelector('[data-testid="guestCheckoutButton"]', { timeout: 120000 });
                await page.click('[data-testid="guestCheckoutButton"]');

                await page.waitForSelector('iframe[title="creditCardForm"]', { state: "visible", timeout: 120000 });
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const iframeHandle = await page.$('iframe[title="creditCardForm"]');
                const cardFrame = await iframeHandle.contentFrame();

                if(cardFrame){

                    await cardFrame.waitForSelector('[data-testid="credit-card-number"]', { timeout: 120000 });
                    await cardFrame.fill('[data-testid="credit-card-number"]', '4242424242424242');
                    await cardFrame.fill('[data-testid="credit-card-exp"]', '04/25');
                    await cardFrame.fill('[data-testid="credit-card-cvv"]', '123');
                    await cardFrame.fill('[data-testid="credit-card-zip"]', '12345');
                    Logger.log("Payment details filled");
                } else {
                    throw new Error("Failed to switch to iframe context");
                }

                await page.waitForSelector('[data-testid="customer-info-inputs-animated-section"]', { state: "visible", timeout: 120000 });
                await page.fill('[data-testid="input-yourInfoPhone"]', `${orderDetail.user_phone}`);
                await page.fill('[data-testid="input-yourInfoEmail"]', `${orderDetail.user_email}`);
                await page.fill('[data-testid="input-yourInfoFirstName"]', `${orderDetail.user_first_name}`);
                await page.fill('[data-testid="input-yourInfoLastName"]', `${orderDetail.user_last_name}`);

                await new Promise(resolve => setTimeout(resolve, 2000));
                Logger.log("Customer details filled successfully");
            }

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