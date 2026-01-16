import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";


const slides = [
  {
    desktop: "/preview/desktop-annual.png",
    mobile: "/preview/mobile-annual.png",
    alt: "Annual running and stroller miles overview",
  },
  {
    desktop: "/preview/desktop-monthly.png",
    mobile: "/preview/mobile-monthly.png",
    alt: "Monthly activity stats and trends",
  },
  {
    desktop: "/preview/desktop-leaderboard.png",
    mobile: "/preview/mobile-leaderboard.png",
    alt: "Community leaderboard rankings",
  },
  {
    desktop: "/preview/desktop-hall-of-fame.png",
    mobile: "/preview/mobile-hall-of-fame.png",
    alt: "Individual activity details",
  },
];

const PreviewCarousel = () => {
  return (
    <section className="previewCarousel">
      <Swiper
        modules={[Pagination, Autoplay]}
        loop
        spaceBetween={24}
        pagination={{ clickable: true }}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <img
              src={slide.desktop}
              srcSet={`${slide.mobile} 768w, ${slide.desktop} 1400w`}
              sizes="(max-width: 768px) 100vw, 1000px"
              alt={slide.alt}
              loading="lazy"
              className="previewImage"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default PreviewCarousel;

