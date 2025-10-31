"use client"
import { Button} from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FaPhone, FaSearchLocation} from "react-icons/fa"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import Stats from "@/data/stats"
import Countup from "react-countup"
import contact from "@/data/cont"
// import Footer from "@/components/myComponents/subs/footer"
import { useAppContext } from "@/hooks/useAppContext"

const About = () => {
  const { selectedVideo, setSelectedVideo, useMock } = useAppContext();
  return (
    <motion.section 
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className= "justify-center w-[100vw] overflow-clip /px-2"
    >
      <section className="md:max-w-[1200px] md:mx-auto md:h-[80vh]">
        <div className="flex flex-col md:flex-row md:justify-between mx-5 md:mx-10 mt-5">
        <span className="text-4xl font-semibold">About <span className="text-accent">us</span></span>
        </div>
        <div className="flex flex-col md:flex-row mx-4 md:m-5">
          <div className="flex-1 mx-2 md:mx-10 my-5 text-secondary-foreground text-center md:text-start">{Stats.about}</div>
          <div className="flex-1 grid grid-cols-2 gap-5 max-w-[580px] my-5">
            {Stats.stats.map((stat, index)=>{
              return(
                <div key={index} className="bg-secondary rounded-lg p-5 shadow-md shadow-accent/50">
                  <Countup 
                    end={stat.num}
                    duration={5}
                    delay={2}
                    separator=""
                    className="text-3xl md:text-5xl text-outline font-extrabold text-background hover:text-accent py-5"
                  />
                  <div className="text-lg font-semibold text-secondary-foreground">{stat.text}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      <div className="flex flex-col md:flex-row md:h-[80vh] items-center md:justify-center max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center md:flex-1 mt-10">
          <div className="text-center text-4xl font-semibold md:mb-10">Meet the <span className="text-accent">Parochial</span></div>
          <Button variant={"outline"} className="border-accent text-accent text-lg  bg-transparent hover:text-slate-100 hidden md:flex">volunteer with us</Button>
        </div>
        <ScrollArea className="h-[41vh] md:h-[45vh] max-w-[720px]  self-center my-10 md:mx-20">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-5">
            {contact.team.map((member, index)=>{
              return (
                <div key={index} className="bg-secondary max-w-[170px] h-[20vh] rounded-lg p-5 flex flex-col justify-center">
                  <div className="font-semibold text-center text-lg">{member.name}</div>
                  <div className="text-center text-sm text-accent">{member.position}</div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
        <Button variant={"outline"} className="border-accent text-accent text-lg  bg-transparent hover:text-slate-100 max-w-[220px] flex md:hidden">volunteer with us</Button>
      </div>
      <div className="flex flex-col /md:flex-row bg-secondary md:bg-background rounded-lg mt-10 /py-10 max-w-6xl md:mx-auto md:px-5">
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="text-center text-4xl font-semibold my-10">Meet our <span className="text-accent">partners</span></div>
          <Button variant={"outline"} className="border-accent text-accent bg-transparent hover:text-slate-100 hidden">I will become a sponsor</Button>
        </div>
        <div className="grid grid-cols-2 /md:grid-cols-3 md:flex md:gap-5 max-w-[720px] my-5 md:mx-20 self-center">
          {contact.partners.map((partner, index)=>{
            return (
              <div key={index}>
                <img src={partner.uri} alt="" className="w-[150px] h-[120px] md:mx-5"/>
                
              </div>
            )
          })}
        </div>
        <Button variant={"outline"} className="border-accent text-accent text-lg bg-transparent hover:text-slate-100 self-center my-5 flex md:hidden">I will become a sponsor</Button>
      </div>
    </motion.section>
  )
}

export default About
