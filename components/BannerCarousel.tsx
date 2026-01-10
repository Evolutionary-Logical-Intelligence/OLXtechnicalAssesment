import React, { useEffect, useState } from 'react';
import defaultStyles from './BannerCarousel.module.css';

interface BannerSlide {
  id: string;
  imageUrl: string;
  alt: string;
}

interface BannerCarouselProps {
  customStyles?: typeof defaultStyles;
  slides?: BannerSlide[];
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({
  customStyles,
  slides: propSlides,
}) => {
  const styles = customStyles || defaultStyles;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const defaultSlides: BannerSlide[] = [
    {
      id: '1',
      imageUrl: '/banners/carouselImage1.jpeg',
      alt: 'Promotional banner 1',
    },
    {
      id: '2',
      imageUrl: '/banners/carouselImage2.jpg',
      alt: 'Promotional banner 2',
    },
    {
      id: '3',
      imageUrl: '/banners/carouselImage3.png',
      alt: 'Promotional banner 3',
    },
  ];

  const slides = propSlides || defaultSlides;

  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  };

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.carouselWrapper}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`${styles.slide} ${
              index === currentSlide ? styles.active : ''
            }`}
          >
            <img
              src={slide.imageUrl}
              alt={slide.alt}
              className={styles.slideImage}
            />
          </div>
        ))}
      </div>


      <div className={styles.dotsContainer}>
        {slides.map((_, index) => (
          <button
            key={index}
            className={`${styles.dot} ${
              index === currentSlide ? styles.active : ''
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;

