import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";

const products = [
  {
    id: 1,
    name: "Asgaard Sofa",
    price: "Rs. 250,000.00",
    rating: "4.7",
    reviews: "204 Review",
    image: "/img/asgaard-sofa-3.png",
    link: "/single-product",
  },
  {
    id: 2,
    name: "Outdoor Sofa Set",
    price: "Rs. 224,000.00",
    rating: "4.2",
    reviews: "145 Review",
    image: "/img/outdoor-sofa-set-1.png",
    link: "/single-product",
  },
];

const generalSpecs = [
  {
    label: "Sales Package",
    values: ["1 sectional sofa", "1 Three Seater, 2 Single Seater"],
  },
  {
    label: "Model Number",
    values: ["TFCBLIGRBL6SRHS", "DTUBLIGRBL568"],
  },
  {
    label: "Secondary Material",
    values: ["Solid Wood", "Solid Wood"],
  },
  {
    label: "Configuration",
    values: ["L-shaped", "L-shaped"],
  },
  {
    label: "Upholstery Material",
    values: ["Fabric + Cotton", "Fabric + Cotton"],
  },
  {
    label: "Upholstery Color",
    values: ["Bright Grey & Lion", "Bright Grey & Lion"],
  },
];

const productSpecs = [
  {
    label: "Filling Material",
    values: ["Foam", "Matte"],
  },
  {
    label: "Finish Type",
    values: ["Bright Grey & Lion", "Bright Grey & Lion"],
  },
  {
    label: "Adjustable Headrest",
    values: ["No", "yes"],
  },
  {
    label: "Maximum Load Capacity",
    values: ["280 KG", "300 KG"],
  },
  {
    label: "Origin of Manufacture",
    values: ["India", "India"],
  },
];

const dimensionSpecs = [
  {
    label: "Width",
    values: ["265.32 cm", "265.32 cm"],
  },
  {
    label: "Height",
    values: ["76 cm", "76 cm"],
  },
  {
    label: "Depth",
    values: ["167.76 cm", "167.76 cm"],
  },
  {
    label: "Weight",
    values: ["45 KG", "65 KG"],
  },
  {
    label: "Seat Height",
    values: ["41.52 cm", "41.52 cm"],
  },
  {
    label: "Leg Height",
    values: ["5.46 cm", "5.46 cm"],
  },
];

const warrantySpecs = [
  {
    label: "Warranty Summary",
    values: [
      "1 Year Manufacturing Warranty",
      "1.2 Year Manufacturing Warranty",
    ],
  },
  {
    label: "Warranty Service Type",
    values: [
      "For Warranty Claims or Any Product Related Issues Please Email at operations@trevifurniture.com",
      "For Warranty Claims or Any Product Related Issues Please Email at support@xyz.com",
    ],
  },
  {
    label: "Covered in Warranty",
    values: [
      "Warranty Against Manufacturing Defect",
      "Warranty of the product is limited to manufacturing defects only.",
    ],
  },
  {
    label: "Not Covered in Warranty",
    values: [
      "The Warranty Does Not Cover Damages Due To Usage Of The Product Beyond Its Intended Use And Wear & Tear In The Natural Course Of Product Usage.",
      "The Warranty Does Not Cover Damages Due To Usage Of The Product Beyond Its Intended Use And Wear & Tear In The Natural Course Of Product Usage.",
    ],
  },
  {
    label: "Domestic Warranty",
    values: ["1 Year", "3 Months"],
  },
];

export const WarrantyInformationSection = (): JSX.Element => {
  return (
    <section className="w-full px-4 py-8">
      <div className="max-w-[1478px] mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <h2 className="[font-family:'Poppins',Helvetica] font-medium text-black text-[28px] leading-[35.4px]">
              Go to Product page for more
              <br />
              Products
            </h2>
            <div className="flex flex-col gap-px">
              <p className="[font-family:'Poppins',Helvetica] font-medium text-[#717171] text-xl">
                View More
              </p>
              <Separator className="w-[115px] h-0.5 bg-[#717171]" />
            </div>
          </div>

          <Link to="/shop">
            <Button
              variant="outline"
              className="h-auto bg-app-primary rounded-md border-none hover:bg-app-primary/90 px-[18px] py-3"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="[font-family:'Poppins',Helvetica] font-semibold text-black text-2xl leading-[30.4px]">
                  Add A Product
                </span>
                <div className="flex items-center gap-2">
                  <span className="[font-family:'Poppins',Helvetica] font-semibold text-white text-sm leading-[17.7px]">
                    Choose a Product
                  </span>
                  <img
                    className="w-5 h-[11px]"
                    alt="Vector"
                    src="/img/vector-63.svg"
                  />
                </div>
              </div>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_1fr] gap-6">
          <div className="hidden lg:block" />

          {products.map((product) => (
            <Card
              key={product.id}
              className="border-none shadow-none bg-transparent"
            >
              <CardContent className="p-0">
                <Link to={product.link} className="block">
                  <div className="bg-[#f9f1e7] rounded-[10px] p-4 mb-4 flex items-center justify-center min-h-[177px]">
                    <img
                      className="max-w-full h-auto object-cover"
                      alt={product.name}
                      src={product.image}
                    />
                  </div>
                </Link>

                <h3 className="[font-family:'Poppins',Helvetica] font-medium text-black text-2xl leading-[30.4px] text-center mb-2">
                  {product.name}
                </h3>

                <p className="[font-family:'Poppins',Helvetica] font-medium text-black text-lg text-center mb-2">
                  {product.price}
                </p>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-black text-lg">
                    {product.rating}
                  </span>
                  <img
                    className="w-[124px] h-5"
                    alt="Rating"
                    src="/img/group-160.png"
                  />
                  <Separator
                    orientation="vertical"
                    className="h-[30px] w-px bg-gray-300"
                  />
                  <span className="[font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-[13px]">
                    {product.reviews}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="space-y-12">
          <div>
            <h3 className="[font-family:'Poppins',Helvetica] font-medium text-black text-[28px] leading-[35.4px] mb-6">
              General
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_1fr] gap-4">
              {generalSpecs.map((spec, index) => (
                <React.Fragment key={index}>
                  <div className="[font-family:'Poppins',Helvetica] font-normal text-black text-xl leading-[25.3px] flex items-center">
                    {spec.label}
                  </div>
                  {spec.values.map((value, valueIndex) => (
                    <div
                      key={valueIndex}
                      className="[font-family:'Poppins',Helvetica] font-normal text-black text-xl leading-[25.3px] flex items-center"
                    >
                      {value}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div>
            <h3 className="[font-family:'Poppins',Helvetica] font-medium text-black text-[28px] leading-[35.4px] mb-6">
              Product
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_1fr] gap-4">
              {productSpecs.map((spec, index) => (
                <React.Fragment key={index}>
                  <div className="[font-family:'Poppins',Helvetica] font-normal text-black text-xl leading-[25.3px] flex items-center">
                    {spec.label}
                  </div>
                  {spec.values.map((value, valueIndex) => (
                    <div
                      key={valueIndex}
                      className="[font-family:'Poppins',Helvetica] font-normal text-black text-xl leading-[25.3px] flex items-center"
                    >
                      {value}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div>
            <h3 className="[font-family:'Poppins',Helvetica] font-medium text-black text-[28px] leading-[35.4px] mb-6">
              Dimensions
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_1fr] gap-4">
              {dimensionSpecs.map((spec, index) => (
                <React.Fragment key={index}>
                  <div className="[font-family:'Poppins',Helvetica] font-normal text-black text-xl leading-[25.3px] flex items-center">
                    {spec.label}
                  </div>
                  {spec.values.map((value, valueIndex) => (
                    <div
                      key={valueIndex}
                      className="[font-family:'Poppins',Helvetica] font-normal text-black text-xl leading-[25.3px] flex items-center"
                    >
                      {value}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div>
            <h3 className="[font-family:'Poppins',Helvetica] font-medium text-black text-[28px] leading-[35.4px] mb-6">
              Warranty
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_1fr] gap-4">
              {warrantySpecs.map((spec, index) => (
                <React.Fragment key={index}>
                  <div className="[font-family:'Poppins',Helvetica] font-normal text-black text-xl leading-[25.3px] flex items-center">
                    {spec.label}
                  </div>
                  {spec.values.map((value, valueIndex) => (
                    <div
                      key={valueIndex}
                      className="[font-family:'Poppins',Helvetica] font-normal text-black text-xl leading-[25.3px] flex items-center"
                    >
                      {value}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_1fr] gap-6 mt-12">
          <div className="hidden lg:block" />
          {products.map((product) => (
            <Link key={product.id} to="/cart">
              <Button className="w-full h-16 bg-app-primary border border-app-primary hover:bg-app-primary/90">
                <span className="[font-family:'Poppins',Helvetica] font-normal text-white text-xl">
                  Add To Cart
                </span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
