import React from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "../../../../components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Separator } from "../../../../components/ui/separator";
import { Textarea } from "../../../../components/ui/textarea";

const formFields = [
  { id: "firstName", label: "First Name", type: "input", width: "half" },
  { id: "lastName", label: "Last Name", type: "input", width: "half" },
  {
    id: "companyName",
    label: "Company Name (Optional)",
    type: "input",
    width: "full",
  },
  {
    id: "country",
    label: "Country / Region",
    type: "select",
    width: "full",
    value: "Sri Lanka",
  },
  {
    id: "streetAddress",
    label: "Street address",
    type: "input",
    width: "full",
  },
  { id: "townCity", label: "Town / City", type: "input", width: "full" },
  {
    id: "province",
    label: "Province",
    type: "select",
    width: "full",
    value: "Western Province",
  },
  { id: "zipCode", label: "ZIP code", type: "input", width: "full" },
  { id: "phone", label: "Phone", type: "input", width: "full" },
  { id: "emailAddress", label: "Email address", type: "input", width: "full" },
];

const paymentMethods = [
  { id: "directBankTransfer", label: "Direct Bank Transfer" },
  { id: "cashOnDelivery", label: "Cash On Delivery" },
];

export const BillingDetailsSection = (): JSX.Element => {
  return (
    <section className="w-full bg-white px-6 py-8 md:px-12 lg:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="flex flex-col gap-8">
            <h1 className="[font-family:'Poppins',Helvetica] font-semibold text-black text-4xl tracking-[0] leading-[normal]">
              Billing details
            </h1>

            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-5">
                  <Label
                    htmlFor="firstName"
                    className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]"
                  >
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    className="h-[75px] bg-white rounded-[10px] border border-solid border-[#9f9f9f]"
                  />
                </div>

                <div className="flex flex-col gap-5">
                  <Label
                    htmlFor="lastName"
                    className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]"
                  >
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    className="h-[75px] bg-white rounded-[10px] border border-solid border-[#9f9f9f]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <Label
                  htmlFor="companyName"
                  className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]"
                >
                  Company Name (Optional)
                </Label>
                <Input
                  id="companyName"
                  className="h-[75px] bg-white rounded-[10px] border border-solid border-[#9f9f9f]"
                />
              </div>

              <div className="flex flex-col gap-5">
                <Label
                  htmlFor="country"
                  className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]"
                >
                  Country / Region
                </Label>
                <Select defaultValue="srilanka">
                  <SelectTrigger className="h-[75px] bg-white rounded-[10px] border border-solid border-[#9f9f9f] [font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="srilanka">Sri Lanka</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-5">
                <Label
                  htmlFor="streetAddress"
                  className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]"
                >
                  Street address
                </Label>
                <Input
                  id="streetAddress"
                  className="h-[75px] bg-white rounded-[10px] border border-solid border-[#9f9f9f]"
                />
              </div>

              <div className="flex flex-col gap-5">
                <Label
                  htmlFor="townCity"
                  className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]"
                >
                  Town / City
                </Label>
                <Input
                  id="townCity"
                  className="h-[75px] bg-white rounded-[10px] border border-solid border-[#9f9f9f]"
                />
              </div>

              <div className="flex flex-col gap-5">
                <Label
                  htmlFor="province"
                  className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]"
                >
                  Province
                </Label>
                <Select defaultValue="western">
                  <SelectTrigger className="h-[75px] bg-white rounded-[10px] border border-solid border-[#9f9f9f] [font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base">
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="western">Western Province</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-5">
                <Label
                  htmlFor="zipCode"
                  className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]"
                >
                  ZIP code
                </Label>
                <Input
                  id="zipCode"
                  className="h-[75px] bg-white rounded-[10px] border border-solid border-[#9f9f9f]"
                />
              </div>

              <div className="flex flex-col gap-5">
                <Label
                  htmlFor="phone"
                  className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]"
                >
                  Phone
                </Label>
                <Input
                  id="phone"
                  className="h-[75px] bg-white rounded-[10px] border border-solid border-[#9f9f9f]"
                />
              </div>

              <div className="flex flex-col gap-5">
                <Label
                  htmlFor="emailAddress"
                  className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]"
                >
                  Email address
                </Label>
                <Input
                  id="emailAddress"
                  className="h-[75px] bg-white rounded-[10px] border border-solid border-[#9f9f9f]"
                />
              </div>

              <div className="flex flex-col gap-5">
                <Textarea
                  id="additionalInfo"
                  placeholder="Additional information"
                  className="h-[75px] bg-white rounded-[10px] border border-solid border-[#9f9f9f] [font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col bg-white">
            <div className="flex flex-col gap-8 pt-12 lg:pt-20">
              <div className="flex justify-between items-center">
                <h2 className="[font-family:'Poppins',Helvetica] font-medium text-black text-2xl tracking-[0] leading-[normal]">
                  Product
                </h2>
                <h2 className="[font-family:'Poppins',Helvetica] font-medium text-black text-2xl tracking-[0] leading-[normal]">
                  Subtotal
                </h2>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="[font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base tracking-[0] leading-[normal]">
                      Asgaard sofa
                    </span>
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
                      X
                    </span>
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
                      1
                    </span>
                  </div>
                  <span className="[font-family:'Poppins',Helvetica] font-light text-black text-base tracking-[0] leading-[normal]">
                    Rs. 250,000.00
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="[font-family:'Poppins',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal]">
                    Subtotal
                  </span>
                  <span className="[font-family:'Poppins',Helvetica] font-light text-black text-base tracking-[0] leading-[normal]">
                    Rs. 250,000.00
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="[font-family:'Poppins',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal]">
                    Total
                  </span>
                  <span className="[font-family:'Poppins',Helvetica] font-bold text-app-primary text-2xl tracking-[0] leading-[normal]">
                    Rs. 250,000.00
                  </span>
                </div>
              </div>

              <Separator className="bg-black h-px" />

              <div className="flex flex-col gap-6">
                <RadioGroup
                  defaultValue="directBankTransfer"
                  className="flex flex-col gap-6"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <RadioGroupItem
                        value="directBankTransfer"
                        id="directBankTransfer"
                        className="w-3.5 h-3.5 border-black data-[state=checked]:bg-black"
                      />
                      <Label
                        htmlFor="directBankTransfer"
                        className="[font-family:'Poppins',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] cursor-pointer"
                      >
                        Direct Bank Transfer
                      </Label>
                    </div>
                    <p className="[font-family:'Poppins',Helvetica] font-light text-[#9f9f9f] text-base text-justify tracking-[0] leading-[normal]">
                      Make your payment directly into our bank account. Please
                      use your Order ID as the payment reference. Your order
                      will not be shipped until the funds have cleared in our
                      account.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <RadioGroupItem
                      value="directBankTransfer2"
                      id="directBankTransfer2"
                      className="w-3.5 h-3.5 border-[#9f9f9f]"
                    />
                    <Label
                      htmlFor="directBankTransfer2"
                      className="[font-family:'Poppins',Helvetica] font-medium text-[#9f9f9f] text-base tracking-[0] leading-[normal] cursor-pointer"
                    >
                      Direct Bank Transfer
                    </Label>
                  </div>

                  <div className="flex items-center gap-4">
                    <RadioGroupItem
                      value="cashOnDelivery"
                      id="cashOnDelivery"
                      className="w-3.5 h-3.5 border-[#9f9f9f]"
                    />
                    <Label
                      htmlFor="cashOnDelivery"
                      className="[font-family:'Poppins',Helvetica] font-medium text-[#9f9f9f] text-base tracking-[0] leading-[normal] cursor-pointer"
                    >
                      Cash On Delivery
                    </Label>
                  </div>
                </RadioGroup>

                <p className="[font-family:'Poppins',Helvetica] font-normal text-black text-base text-justify tracking-[0] leading-[normal]">
                  <span className="font-light">
                    Your personal data will be used to support your experience
                    throughout this website, to manage access to your account,
                    and for other purposes described in our{" "}
                  </span>
                  <span className="font-semibold">privacy policy.</span>
                </p>

                <div className="flex justify-center">
                  <Button className="w-80 h-16 rounded-[15px] border border-solid border-black bg-transparent hover:bg-black hover:text-white [font-family:'Poppins',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal]">
                    Place order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
