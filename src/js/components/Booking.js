import { select, templates } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Booking {
  constructor(bookingWidget) {
    const thisBooking = this;

    thisBooking.render(bookingWidget);
    thisBooking.initWidgets();
  }


  render(element) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget(element);
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    //const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    //element.appendChild(generatedDOM);
    thisBooking.dom.wrapper.element = utils.createDOMFromHTML(generatedHTML);
    element.appendChild(thisBooking.dom.wrapper.element);

    thisBooking.dom.peopleAmount = element.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = element.querySelector(select.booking.hoursAmount);
    console.log(thisBooking.dom.peopleAmount);
    console.log(thisBooking.dom.hoursAmount);

  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    console.log(thisBooking.peopleAmount);
    console.log(thisBooking.hoursAmount);
  }
}


export default Booking;
