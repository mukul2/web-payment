const express = require('express');
const ejs = require('ejs');
const paypal = require('paypal-rest-sdk');
const axios = require('axios')
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AbZcTBiyddfmw5Cnh6oTKaURCmALlmN18LsGxz4WDZY6714koqcQNfJ2Qm-AIQNhWk-TjqstCTHpBQXD',
  'client_secret': 'EKhFgFpUrlW1LDVxd4QwsyIkz7e3TYa2AvSv7QCI-9uAja8u2LxIwH1LIsih8FSDqekvITP2KpVmvPBm'
});

const app = express();
 
var  amount = 0;
var  serviceName ="No Service Name";
var userid = 1;
var docid = 1;
var nom = 1;
var starts = "";
var ends = "";

app.set('view engine', 'ejs');

app.get('/', (req, res) =>{

  amount = req.query.amount;
  serviceName = req.query.service;
  userid = req.query.userid;
  docid = req.query.docid;
  nom = req.query.nom;
  starts = req.query.starts;
  ends = req.query.ends;

   res.render('index')} );
app.get('/second', (req, res) => res.render('index2'));
app.post('/pay', (req, res) => {
  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:3000/success",
        "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": serviceName,
                "sku": "001",
                "price": amount,
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total":amount
        },
        "description": serviceName
    }]
};

paypal.payment.create(create_payment_json, function (error, payment) {
  if (error) {
      throw error;
  } else {
      for(let i = 0;i < payment.links.length;i++){
        if(payment.links[i].rel === 'approval_url'){
          res.redirect(payment.links[i].href);
        }
      }
  }
});

});

app.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": amount
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));
        res.send(JSON.stringify(payment));

        if(serviceName == "Prescription Service"){

        axios.post('http://iosapp.abettahealth.com/api/add_payment_info_only', {
        patient_id: userid,dr_id:docid,amount:amount,status:1,reason:serviceName,transID:paymentId}).then(res => {
        console.log(`statusCode: ${res.statusCode}`)
        console.log(res)
        }).catch(error => {
        console.error(error)})

      }else  if(serviceName == "Month Subscription"){
        
        axios.post('http://iosapp.abettahealth.com/api/add_subscription_info', {
        patient_id: userid,dr_id:docid,amount:amount,payment_status:1,number_of_month:nom,reason:serviceName,payment_details:paymentId,starts:starts,ends:ends,status:1}).then(res => {
        console.log(`statusCode: ${res.statusCode}`)
        console.log(res)
        }).catch(error => {
        console.error(error)})        

      }


    }
});
});







app.get('/cancel', (req, res) => res.send('Cancelled by mkl'));

app.listen(process.env.PORT || 3000, function () { 
    console.log("SERVER STARTED POR2T: 3000"); 
});