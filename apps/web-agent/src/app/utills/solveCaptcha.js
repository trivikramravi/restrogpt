// utils/solveCaptcha.js
const axios = require('axios');

const API_KEY = 'b1814ca03fc8fd32ebae06e080ea6c81';

const solveCaptcha = async (siteKey, pageUrl) => {
  try {
    // Step 1: Send the captcha solving request
    const res = await axios.post('http://2captcha.com/in.php', null, {
      params: {
        key: API_KEY,
        method: 'userrecaptcha',
        googlekey: siteKey,
        pageurl: pageUrl,
        json: 1
      }
    });

    const requestId = res.data.request;
    
    // Step 2: Poll for the result
    let result;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const res = await axios.get('http://2captcha.com/res.php', {
        params: {
          key: API_KEY,
          action: 'get',
          id: requestId,
          json: 1
        }
      });

      if (res.data.status === 1) {
        result = res.data.request;
        break;
      }
    }

    return result;
  } catch (error) {
    console.error('Error solving captcha:', error);
    return null;
  }
};

module.exports = solveCaptcha;
