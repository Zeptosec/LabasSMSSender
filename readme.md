## Labas message sending API
# How it works?
It logs in with your credentials into the website, gets the keys required to send the message and then posts the message to their api endpoint.
# How to use it?
Configure **.env** file then import the function and call it. Example:
```js
// importing the function that will be used to send the message
import { sendMessage } from './smsender.js';

// sending the message
const rs = await sendMessage(number, message);

if(rs.succ){
    // sent successfully
} else {
    // failed to send
}
```