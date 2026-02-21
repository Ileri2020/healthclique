import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const textsAnimationsList = ['TextAnimations', 'Text 2', 'TextAnimations', 'Text 4'];
const slideInTexts = ['SlideInText', 'Text 2', 'SlideInText', 'Text 4'];
const scaleInTexts = ['ScaleInText', 'Text 2', 'ScaleInText', 'Text 4'];
const rotateInTexts = ['RotateInText', 'Text 2', 'RotateInText', 'Text 4'];
const flyInTexts = ['FlyInText', 'Text 2', 'FlyInText', 'Text 4'];
const typewriterTexts = ['TypewriterText', 'Text 2', 'TypewriterText', 'Text 4'];
const slideUpTexts = ['SlideUpText', 'Text 2', 'SlideUpText', 'Text 4'];
const bounceInTexts = ['BounceInText', 'Text 2', 'BounceInText', 'Text 4'];
const flipInTexts = ['FlipInText', 'Text 2', 'FlipInText', 'Text 4'];

const jsontext = [
  {
    "verse": "Blessed are the peacemakers: for they shall be called the children of God.",
    "page": "Matthew 5:9"
  },
  {
    "verse": "Thou wilt keep him in perfect peace, whose mind is stayed on thee...",
    "page": "Isaiah 26:3"
  },
  {
    "verse": "But the fruit of the Spirit is love, joy, peace, longsuffering...",
    "page": "Galatians 5:22-23"
  },
  {
    "verse": "For we walk by faith, not by sight.",
    "page": "2 Corinthians 5:7"
  },
  {
    "verse": "No weapon that is formed against thee shall prosper...",
    "page": "Isaiah 54:17"
  },
  {
    "verse": "The Lord bless thee, and keep thee: The Lord make his face shine upon thee...",
    "page": "Numbers 6:24-26"
  },
  {
    "verse": "Delight thyself also in the Lord: and he shall give thee the desires of thine heart.",
    "page": "Psalm 37:4"
  },
  {
    "verse": "The Lord is good, a strong hold in the day of trouble...",
    "page": "Nahum 1:7"
  },
  {
    "verse": "Be still, and know that I am God...",
    "page": "Psalm 46:10"
  },
  {
    "verse": "I have set the Lord always before me: because he is at my right hand, I shall not be moved.",
    "page": "Psalm 16:8"
  },
  {
    "verse": "He healeth the broken in heart, and bindeth up their wounds.",
    "page": "Psalm 147:3"
  },
  {
    "verse": "The steps of a good man are ordered by the Lord...",
    "page": "Psalm 37:23"
  },
  {
    "verse": "Cast thy burden upon the Lord, and he shall sustain thee...",
    "page": "Psalm 55:22"
  },
  {
    "verse": "Therefore if any man be in Christ, he is a new creature...",
    "page": "2 Corinthians 5:17"
  },
  {
    "verse": "For the wages of sin is death; but the gift of God is eternal life...",
    "page": "Romans 6:23"
  },
  {
    "verse": "Let your light so shine before men, that they may see your good works...",
    "page": "Matthew 5:16"
  },
  {
    "verse": "For the Spirit God gave us does not make us timid...",
    "page": "2 Timothy 1:7"
  },
  {
    "verse": "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.",
    "page": "Psalm 91:1"
  }
];

export const TextAnimations = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % textsAnimationsList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: {
            duration: 2.0,
            delay: 0.5,
          },
        }}
        className="text-lg font-bold text-gray-800"
      >
        {textsAnimationsList[currentIndex]}
      </motion.div>
    </div>
  );
};

export const SlideInText = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slideInTexts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ x: '-100%' }}
        animate={{
          x: '0%',
          transition: {
            duration: 4.0,
            delay: 0.5,
          },
        }}
        className="text-lg font-bold text-gray-800"
      >
        {slideInTexts[currentIndex]}
      </motion.div>
    </div>
  );
};

export const ScaleInText = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % scaleInTexts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          transition: {
            duration: 4.0,
            delay: 0.5,
          },
        }}
        className="text-lg font-bold text-gray-800"
      >
        {scaleInTexts[currentIndex]}
      </motion.div>
    </div>
  );
};

export const RotateInText = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % rotateInTexts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ rotate: '0deg' }}
        animate={{
          rotate: '360deg',
          transition: {
            duration: 4.0,
            delay: 0.5,
          },
        }}
        className="text-lg font-bold text-gray-800"
      >
        {rotateInTexts[currentIndex]}
      </motion.div>
    </div>
  );
};

export const FlyInText = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % flyInTexts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ x: '-100%' }}
        animate={{
          x: '0%',
          transition: {
            duration: 4.0,
            delay: 0.5,
          },
        }}
        className="text-lg font-bold text-gray-800"
      >
        {flyInTexts[currentIndex]}
      </motion.div>
    </div>
  );
};

export const TypewriterText = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % typewriterTexts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ width: '0%' }}
        animate={{
          width: '100%',
          transition: {
            duration: 4.0,
            delay: 0.5,
          },
        }}
        className="text-lg font-bold text-gray-800"
      >
        {typewriterTexts[currentIndex]}
      </motion.div>
    </div>
  );
};

export const SlideUpText = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slideUpTexts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ y: '100%' }}
        animate={{
          y: '0%',
          transition: {
            duration: 4.0,
            delay: 0.5,
          },
        }}
        className="text-lg font-bold text-gray-800"
      >
        {slideUpTexts[currentIndex]}
      </motion.div>
    </div>
  );
};

export const BounceInText = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % bounceInTexts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          transition: {
            duration: 4.0,
            delay: 0.5,
          },
        }}
        className="text-lg font-bold text-gray-800"
      >
        {bounceInTexts[currentIndex]}
      </motion.div>
    </div>
  );
};

export const ZoomInText = () => {
  const [currentIndex, setCurrentIndex] = useState(Math.floor(Math.random() * jsontext.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(Math.floor(Math.random() * jsontext.length));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4 h-36">
      <motion.div
        key={currentIndex}
        initial={{ scale: 0 }}
        animate={{ scale: 1, transition: { duration: 1.0, delay: 0.5 } }}
        className="text-lg font-bold text-gray-800 text-center text-foreground/80 dark:text-slate-200"
      >
        <div className="p-2">{jsontext[currentIndex].verse}</div>
        <div className="text-sm">{jsontext[currentIndex].page}</div>
      </motion.div>
    </div>
  );
};

export const FlipInText = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % flipInTexts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ rotateY: '180deg' }}
        animate={{
          rotateY: '0deg',
          transition: {
            duration: 4.0,
            delay: 0.5,
          },
        }}
        className="text-lg font-bold text-gray-800"
      >
        {flipInTexts[currentIndex]}
      </motion.div>
    </div>
  );
};