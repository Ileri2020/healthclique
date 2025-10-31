import {AiOutlineSearch, AiOutlineHome, AiOutlineShop, AiOutlineMan, AiOutlineContacts, AiOutlineWoman, AiOutlineProfile,AiOutlineHistory} from "react-icons/ai"
import { BiPhoneCall, BiSolidContact, BiPhone,} from "react-icons/bi"
import { CiShoppingCart, } from "react-icons/ci"
import { IoMdHelp } from "react-icons/io";
import { VscAccount } from "react-icons/vsc";
import { IoFastFoodOutline } from "react-icons/io5";




export default {Links : [
    {
      name: <AiOutlineHome />,
      path: "/",
    },
    {
      name: <AiOutlineShop />,
      path: "/store",
    },
    // {
    //   name: <IoMdHelp />,
    //   path: "/help",
    // },
    // {
    //   name: <IoFastFoodOutline />,
    //   path: "/lunch",
    // },
    {
      name: <AiOutlineHistory />,
      path: "/about",
    },
    {
      name: <BiPhone />,
      path: "/contact",
    },
    {
      name: <VscAccount />,
      path: "/account",
    },
    // {
    //   name: "blogs",
    //   path: "/blogs",
    // },
    // {
    //   name: <CiShoppingCart />,
    //   path: "/cart",
    // },
  ]
}