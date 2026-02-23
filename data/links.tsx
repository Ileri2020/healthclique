import {AiOutlineSearch, AiOutlineHome, AiOutlineShop, AiOutlineMan, AiOutlineContacts, AiOutlineWoman, AiOutlineProfile,AiOutlineHistory} from "react-icons/ai"
import { BiPhoneCall, BiSolidContact, BiPhone,} from "react-icons/bi"
import { CiShoppingCart, } from "react-icons/ci"
import { IoMdHelp } from "react-icons/io";
import { VscAccount } from "react-icons/vsc";
import { IoFastFoodOutline } from "react-icons/io5";




export default {Links : [
    {
      name: <AiOutlineHome />,
      title: "Home",
      path: "/",
    },
    {
      name: <AiOutlineShop />,
      title: "Store",
      path: "/store",
    },
    {
      name: <AiOutlineHistory />,
      title: "About",
      path: "/about",
    },
    {
      name: <BiPhone />,
      title: "Contact",
      path: "/contact",
    },
    {
      name: <AiOutlineProfile />,
      title: "Blog",
      path: "/blog",
    },
    {
      name: <VscAccount />,
      title: "Account",
      path: "/account",
    },
  ]
}