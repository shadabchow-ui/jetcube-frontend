import { Trash2Icon } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";

const cartItems = [
  {
    id: 1,
    name: "Asgaard sofa",
    price: "Rs. 250,000.00",
    quantity: 1,
    subtotal: "Rs. 250,000.00",
    image: "/img/mask-group-1.png",
    link: "/single-product",
  },
];

export const CartSummarySection = (): JSX.Element => {
  return (
    <section className="w-full bg-white px-6 py-16 md:px-[100px] md:py-[63px]">
      <div className="mx-auto max-w-[1240px] flex flex-col lg:flex-row gap-[30px]">
        <div className="flex-1 lg:w-[817px]">
          <div className="bg-[#f9f1e7] rounded-sm overflow-hidden">
            <div className="grid grid-cols-4 gap-4 px-6 py-4 [font-family:'Poppins',Helvetica] font-medium text-black text-base">
              <div>Product</div>
              <div>Price</div>
              <div>Quantity</div>
              <div>Subtotal</div>
            </div>
          </div>

          <div className="mt-12">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-4 gap-4 items-center px-6"
              >
                <div className="flex items-center gap-4">
                  <Link to={item.link} className="block">
                    <div className="relative w-[105px] h-[105px]">
                      <div className="absolute inset-0 bg-[#b88e2f38] rounded-[10px]" />
                      <img
                        className="relative w-full h-full object-cover"
                        alt={item.name}
                        src={item.image}
                      />
                    </div>
                  </Link>
                  <span className="[font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base">
                    {item.name}
                  </span>
                </div>

                <div className="[font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base">
                  {item.price}
                </div>

                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-[5px] border border-solid border-[#9f9f9f] flex items-center justify-center">
                    <span className="[font-family:'Poppins',Helvetica] font-normal text-black text-base">
                      {item.quantity}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="[font-family:'Poppins',Helvetica] font-normal text-black text-base">
                    {item.subtotal}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-app-primary hover:text-app-primary/80"
                  >
                    <Trash2Icon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:w-[393px]">
          <Card className="bg-[#f9f1e7] border-0">
            <CardContent className="p-[75px_24px_61px]">
              <h2 className="text-center [font-family:'Poppins',Helvetica] font-semibold text-[32px] text-black mb-[61px]">
                Cart Totals
              </h2>

              <div className="space-y-[31px] mb-[42px]">
                <div className="flex justify-between items-center">
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-black text-base">
                    Subtotal
                  </span>
                  <span className="[font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base">
                    Rs. 250,000.00
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-black text-base">
                    Total
                  </span>
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-app-primary text-xl">
                    Rs. 250,000.00
                  </span>
                </div>
              </div>

              <Link to="/checkout" className="block">
                <Button
                  variant="outline"
                  className="w-full h-[59px] rounded-[15px] border-black hover:bg-black hover:text-white transition-colors"
                >
                  <span className="[font-family:'Poppins',Helvetica] font-normal text-xl">
                    Check Out
                  </span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
