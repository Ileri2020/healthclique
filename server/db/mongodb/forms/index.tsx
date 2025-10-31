import AddressForm from "./address";
import CartForm from "./cart";
import CouponForm from "./coupon";
import NotificationForm from "./notification";
import PaymentForm from "./payment";
import RefundForm from "./refund";
import ReviewForm from "./review";
import SaleForm from "./sales";
import StockForm from "./stock";
import UserForm from "./user";

export const forms = [
    {
        model : "User",
        form : UserForm,
    },
    {
        model : "Stock",
        form : StockForm,
    },
    {
        model : "Sale",
        form : SaleForm,
    },
    {
        model : "Review",
        form : ReviewForm,
    },
    {
        model : "Refund",
        form : RefundForm,
    },
    {
        model : "Payment",
        form : PaymentForm,
    },
    {
        model : "Notification",
        form : NotificationForm,
    },
    {
        model : "Coupon",
        form : CouponForm,
    },
    {
        model : "Cart",
        form : CartForm,
    },
    {
        model : "Address",
        form : AddressForm,
    },
]