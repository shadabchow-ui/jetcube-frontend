import React from "react";

const features = [
  {
    icon: "/img/vector-64.svg",
    iconClass:
      "relative w-[53px] h-[60px] left-1 bg-[url(/img/vector-64.svg)] bg-[100%_100%]",
    title: "High Quality",
    subtitle: "crafted from top materials",
  },
  {
    icon: "/img/vector-65.svg",
    iconClass: "h-[96.88%] bg-[url(/img/vector-65.svg)] bg-[100%_100%]",
    title: "Warranty Protection",
    subtitle: "Over 2 years",
  },
  {
    icon: "/img/vector-37.svg",
    iconClass: "absolute w-[100.00%] h-[93.28%] top-[3.36%] left-0",
    title: "Free Shipping",
    subtitle: "Order over 150 $",
  },
  {
    icon: "/img/vector-67.svg",
    iconClass: "absolute w-[88.24%] h-full top-0 left-[5.88%]",
    title: "24 / 7 Support",
    subtitle: "Dedicated support",
  },
];

export const CartItemsSection = (): JSX.Element => {
  return (
    <section className="flex w-full relative mt-[22px] flex-col items-center justify-around gap-2.5 px-0 py-[100px] bg-[#faf3ea]">
      <div className="flex w-full max-w-[1334px] items-center justify-between relative flex-wrap gap-6 px-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-2.5 relative flex-[0_0_auto]"
          >
            <div className="relative w-[60px] h-[60px] flex-shrink-0">
              {index === 0 && <div className={feature.iconClass} />}
              {index === 1 && (
                <div className="relative w-[60px] h-[60px] overflow-hidden">
                  <div className={feature.iconClass} />
                </div>
              )}
              {(index === 2 || index === 3) && (
                <img
                  className={feature.iconClass}
                  alt={feature.title}
                  src={feature.icon}
                />
              )}
            </div>

            <div className="inline-flex flex-col items-start gap-0.5 relative flex-[0_0_auto]">
              <h3 className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#242424] text-[25px] tracking-[0] leading-[37.5px] whitespace-nowrap">
                {feature.title}
              </h3>

              <p className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-color-gray-3 text-xl tracking-[0] leading-[30px] whitespace-nowrap">
                {feature.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
