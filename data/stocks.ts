import img1 from "./../public/small chops 5.jpg"
import img2 from "./../public/shawama pics 1.jpg"
import img3 from "./../public/small chops 4.jpg"
import img4 from "./../public/mission-burrito-fast-food-shawarma-kati-roll-breakfast-6dd86711999109a88eae948201cd24bf.png"
import img5 from "./../public/small chops 3.jpg"
import img6 from "./../public/flyer.jpg"
import img7 from "./../public/shawama pics 1.jpg"

let fetchedData = null;

fetch(`/api/data/stock?limit=10`)
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Error fetching data');
    }
  })
  .then(data => {
    fetchedData = data;
    console.log(fetchedData); // Verify data is stored
  })
  .catch(error => {
    console.error(error);
  });


export default {
    title : "stocks",
    description : "available stocks",
    //stocks : fetchedData,
    stocks : [
        {
            img : img1,
            name : "puffpuff",
            id : 1,
            Description : "special recipe from succo, good looks",
            price: 50,
            availability: true,
            qty: 1000
        },
        {
            img : img2,
            name : "chicken",
            id : 2,
            Description : "tasty grilled chicken, succo special recipe",
            price: 700,
            availability: true,
            qty: 100
        },
        {
            img : img3,
            name : "samosa",
            id : 3,
            Description : "perfectly made and nice taste beef samosa",
            price: 200,
            availability: true,
            qty: 100
        },
        {
            img : img4,
            name : "spring roll",
            id : 4,
            Description : "Placeholder Text",
            price: 200,
            availability: true,
            qty: 100
        },
        {
            img : img5,
            name : "fanta",
            id : 5,
            Description : "Placeholder Text",
            price: 1500,
            availability: true,
            qty: 100
        },
        {
            img : img6,
            name : "rice",
            id : 6,
            Description : "Placeholder Text",
            price: 1500,
            availability: true,
            qty: 100
        },
        {
            img : img7,
            name : "chin chin",
            id : 7,
            Description : "Placeholder Text",
            price: 2000,
            availability: true,
            qty: 100
        },
        {
            img : img4,
            name : "egg roll",
            id : 8,
            Description : "Placeholder Text",
            price: 500,
            availability: true,
            qty: 100
        },
        {
            img : img2,
            name : "meat pie",
            id : 9,
            Description : "Placeholder Text",
            price: 600,
            availability: true,
            qty: 100
        },
        {
            img : img6,
            name : "doughnut",
            id : 10,
            Description : "Placeholder Text",
            price: 400,
            availability: true,
            qty: 100
        },
        {
            img : img1,
            name : "coke",
            id : 11,
            Description : "Placeholder Text",
            price: 1500,
            availability: true,
            qty: 100
        },
        {
            img : img4,
            name : "malt",
            id : 12,
            Description : "Placeholder Text",
            price: 1500,
            availability: true,
            qty: 100
        },
        {
            img : img1,
            name : "puffpuff",
            id : 1,
            Description : "special recipe from succo, good looks",
            price: 50,
            availability: true,
            qty: 1000
        },
        {
            img : img2,
            name : "chicken",
            id : 2,
            Description : "tasty grilled chicken, succo special recipe",
            price: 700,
            availability: true,
            qty: 100
        },
        {
            img : img3,
            name : "samosa",
            id : 3,
            Description : "perfectly made and nice taste beef samosa",
            price: 200,
            availability: true,
            qty: 100
        },
        {
            img : img4,
            name : "spring roll",
            id : 4,
            Description : "Placeholder Text",
            price: 200,
            availability: true,
            qty: 100
        },
        {
            img : img5,
            name : "fanta",
            id : 5,
            Description : "Placeholder Text",
            price: 1500,
            availability: true,
            qty: 100
        },
        {
            img : img6,
            name : "rice",
            id : 6,
            Description : "Placeholder Text",
            price: 1500,
            availability: true,
            qty: 100
        },
        {
            img : img7,
            name : "chin chin",
            id : 7,
            Description : "Placeholder Text",
            price: 2000,
            availability: true,
            qty: 100
        },
        {
            img : img4,
            name : "egg roll",
            id : 8,
            Description : "Placeholder Text",
            price: 500,
            availability: true,
            qty: 100
        },
        {
            img : img2,
            name : "meat pie",
            id : 9,
            Description : "Placeholder Text",
            price: 600,
            availability: true,
            qty: 100
        },
        {
            img : img6,
            name : "doughnut",
            id : 10,
            Description : "Placeholder Text",
            price: 400,
            availability: true,
            qty: 100
        },
        {
            img : img1,
            name : "coke",
            id : 11,
            Description : "Placeholder Text",
            price: 1500,
            availability: true,
            qty: 100
        },
        {
            img : img4,
            name : "malt",
            id : 12,
            Description : "Placeholder Text",
            price: 1500,
            availability: true,
            qty: 100
        },
        {
            img : img1,
            name : "puffpuff",
            id : 1,
            Description : "special recipe from succo, good looks",
            price: 50,
            availability: true,
            qty: 1000
        },
        {
            img : img2,
            name : "chicken",
            id : 2,
            Description : "tasty grilled chicken, succo special recipe",
            price: 700,
            availability: true,
            qty: 100
        },
        {
            img : img3,
            name : "samosa",
            id : 3,
            Description : "perfectly made and nice taste beef samosa",
            price: 200,
            availability: true,
            qty: 100
        },
        {
            img : img4,
            name : "spring roll",
            id : 4,
            Description : "Placeholder Text",
            price: 200,
            availability: true,
            qty: 100
        },
        {
            img : img5,
            name : "fanta",
            id : 5,
            Description : "Placeholder Text",
            price: 1500,
            availability: true,
            qty: 100
        },
        {
            img : img6,
            name : "rice",
            id : 6,
            Description : "Placeholder Text",
            price: 1500,
            availability: true,
            qty: 100
        },
        {
            img : img7,
            name : "chin chin",
            id : 7,
            Description : "Placeholder Text",
            price: 2000,
            availability: true,
            qty: 100
        },
        {
            img : img4,
            name : "egg roll",
            id : 8,
            Description : "Placeholder Text",
            price: 500,
            availability: true,
            qty: 100
        },
        {
            img : img2,
            name : "meat pie",
            id : 9,
            Description : "Placeholder Text",
            price: 600,
            availability: true,
            qty: 100
        },
        {
            img : img6,
            name : "doughnut",
            id : 10,
            Description : "Placeholder Text",
            price: 400,
            availability: true,
            qty: 100
        },
        {
            img : img1,
            name : "coke",
            id : 11,
            Description : "Placeholder Text",
            price: 1500,
            availability: true,
            qty: 100
        },
        {
            img : img4,
            name : "malt",
            id : 12,
            Description : "Placeholder Text",
            price: 1500,
            availability: true,
            qty: 100
        },
    ]
}