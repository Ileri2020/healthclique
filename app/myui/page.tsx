"use client"

import { AccordionDemo } from "@/components/myUI/accordion"
import { AlertDialogDemo } from "@/components/myUI/alertDialog"
import { CalendarDemo } from "@/components/myUI/calendar"
import { CardWithForm } from "@/components/myUI/card"
import { CheckboxDemo } from "@/components/myUI/checkbox"
import { CollapsibleDemo } from "@/components/myUI/collapsible"
import { ComboboxDemo } from "@/components/myUI/combobox"
import { CommandDemo } from "@/components/myUI/command"
import { ContextMenuDemo } from "@/components/myUI/contextmenu"
import { DataTableDemo } from "@/components/myUI/datatable"
import { DatePickerDemo } from "@/components/myUI/datepicker"
import { DialogDemo } from "@/components/myUI/dialog"
import { DrawerDemo } from "@/components/myUI/drawer"
import { DropdownMenuDemo } from "@/components/myUI/dropDownMenu"
import { MenubarDemo } from "@/components/myUI/menubar"
import { PaginationDemo } from "@/components/myUI/pagination"
import { PopoverDemo } from "@/components/myUI/popover"
import { ProgressDemo } from "@/components/myUI/progressbar"
import { RadioGroupDemo } from "@/components/myUI/radiogroup"
import { ResizableDemo } from "@/components/myUI/resizable"
import { SeparatorDemo } from "@/components/myUI/separator"
import { SkeletonDemo } from "@/components/myUI/skeleton"
import { SonnerDemo } from "@/components/myUI/sonner"
import { SwitchDemo } from "@/components/myUI/switch"
import { TableDemo } from "@/components/myUI/table"
import { ToastDemo } from "@/components/myUI/toast"
import { ToggleDemo } from "@/components/myUI/toggle"
import { ToggleGroupDemo } from "@/components/myUI/toggle-group"
import { TooltipDemo } from "@/components/myUI/tooltip"

const page = () => {
  return (
    <div className="flex flex-row justify-between px-10">
      my uis
            <div className="flex flex-col gap-10 max-w-md mx-auto">
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">accordion</div>
            <AccordionDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">alertDialog</div>
            <AlertDialogDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">calendar</div>
            <CalendarDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">Card</div>
            <CardWithForm />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">checkbox</div>
            <CheckboxDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">callapsible</div>
            <CollapsibleDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">combobox</div>
            <ComboboxDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">tooltip</div>
            <TooltipDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">toggle</div>
            <ToggleDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">toggle group</div>
            <ToggleGroupDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">toast</div>
            <ToastDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">table</div>
            <TableDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">switch</div>
            <SwitchDemo />
        </div>
        <div className="flex flex-col gap-10 max-w-md mx-auto">
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">sonner</div>
            <SonnerDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">skeleton</div>
            <SkeletonDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">separator</div>
            <SeparatorDemo /><div className="text-accent font-bold w-full text-center bg-secondary text-xl"></div>
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">resizable</div>
            <ResizableDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">radio group</div>
            <RadioGroupDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">progress</div>
            <ProgressDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">popover</div>
            <PopoverDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">pagination</div>
            <PaginationDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">menu bar</div>
            <MenubarDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">dropdown menu</div>
            <DropdownMenuDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">drawer</div>
            <DrawerDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">dialog</div>
            <DialogDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">date picker</div>
            <DatePickerDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">data table</div>
            <DataTableDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">context menu</div>
            <ContextMenuDemo />
            <div className="text-accent font-bold w-full text-center bg-secondary text-xl">command</div>
            <CommandDemo />
        </div>
    </div>
  )
}

export default page
