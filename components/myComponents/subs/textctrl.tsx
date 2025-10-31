
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const TextAnimations = () => {
  const texts = ['TextAnimations', 'Text 2', 'TextAnimations', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: {
            duration: 2.0,
            delay: 0.5,
            /*repeat: Infinity,*/
          },
        }}
        className="text-lg font-bold text-gray-800"
      >
        {texts[currentIndex]}
      </motion.div>
    )
  }
  

  return (
    <div className="container mx-auto p-4">
        <Temp />
    </div>
  );
};



export const SlideInText = () => {
  const texts = ['SlideInText', 'Text 2', 'SlideInText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  
  const Temp = () => {
    return (
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
          {texts[currentIndex]}
        </motion.div>
    )
  }
  

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};



export const ScaleInText = () => {
  const texts = ['ScaleInText', 'Text 2', 'ScaleInText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
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
          {texts[currentIndex]}
        </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};



export const RotateInText = () => {
  const texts = ['RotateInText', 'Text 2', 'RotateInText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
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
          {texts[currentIndex]}
        </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};



export const FlyInText = () => {
  const texts = ['FlyInText', 'Text 2', 'FlyInText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
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
          {texts[currentIndex]}
        </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};


export const TypewriterText = () => {
  const texts = ['TypewriterText', 'Text 2', 'TypewriterText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
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
          {texts[currentIndex]}
        </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};



export const SlideUpText = () => {
  const texts = ['SlideUpText', 'Text 2', 'SlideUpText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
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
          {texts[currentIndex]}
        </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};



export const BounceInText = () => {
  const texts = ['BounceInText', 'Text 2', 'BounceInText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
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
          {texts[currentIndex]}
        </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};






export const ZoomInText = () => {
  const texts = jsontext;
  const [currentIndex, setCurrentIndex] = useState(Math.floor(Math.random() * texts.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(Math.floor(Math.random() * texts.length));
    }, 6000);
    return () => clearInterval(interval);
  }, [texts]);

  return (
    <div className="container mx-auto p-4 h-36">
      <motion.div
        key={currentIndex}
        initial={{ scale: 0 }}
        animate={{ scale: 1, transition: { duration: 1.0, delay: 0.5 } }}
        className="text-lg font-bold text-gray-800 text-center text-foreground/80 dark:text-slate-200"
      >
        <div className="p-2">{texts[currentIndex].verse}</div>
        <div className="text-sm">{texts[currentIndex].page}</div>
      </motion.div>
    </div>
  );
};







export const FlipInText = () => {
  const texts = ['FlipInText', 'Text 2', 'FlipInText', 'Text 4'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
        setCurrentIndex((prevIndex)=>(prevIndex+1)%texts.length)
    },6000)
    return()=>clearInterval(interval)
  },[currentIndex])

  const Temp = () => {
    return (
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
          {texts[currentIndex]}
        </motion.div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Temp />
    </div>
  );
};


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
  },
  {
    "verse": "For by grace are ye saved through faith; and that not of yourselves...",
    "page": "Ephesians 2:8"
  },
  {
    "verse": "And let us not be weary in well doing: for in due season we shall reap...",
    "page": "Galatians 6:9"
  },
  {
    "verse": "But my God shall supply all your need according to his riches in glory...",
    "page": "Philippians 4:19"
  },
  {
    "verse": "The Lord is nigh unto all them that call upon him...",
    "page": "Psalm 145:18"
  },
  {
    "verse": "O give thanks unto the Lord; for he is good...",
    "page": "Psalm 107:1"
  },
  {
    "verse": "He only is my rock and my salvation; he is my defence; I shall not be greatly moved.",
    "page": "Psalm 62:2"
  },
  {
    "verse": "Let us come before his presence with thanksgiving...",
    "page": "Psalm 95:2"
  },
  {
    "verse": "Call unto me, and I will answer thee, and show thee great and mighty things...",
    "page": "Jeremiah 33:3"
  },
  {
    "verse": "A new commandment I give unto you, That ye love one another...",
    "page": "John 13:34"
  },
  {
    "verse": "I am the way, the truth, and the life: no man cometh unto the Father, but by me.",
    "page": "John 14:6"
  },
  {
    "verse": "Even though I walk through the valley of the shadow of death, I will fear no evil...",
    "page": "Psalm 23:4"
  },
  {
    "verse": "We love him, because he first loved us.",
    "page": "1 John 4:19"
  },
  {
    "verse": "Humble yourselves therefore under the mighty hand of God, that he may exalt you...",
    "page": "1 Peter 5:6"
  },
  {
    "verse": "In the beginning God created the heaven and the earth.",
    "page": "Genesis 1:1"
  },
  {
    "verse": "The Lord is my shepherd; I shall not want.",
    "page": "Psalm 23:1"
  },
  {
    "verse": "For God so loved the world, that he gave his only begotten Son...",
    "page": "John 3:16"
  },
  {
    "verse": "I can do all things through Christ which strengtheneth me.",
    "page": "Philippians 4:13"
  },
  {
    "verse": "Trust in the Lord with all thine heart; and lean not unto thine own understanding.",
    "page": "Proverbs 3:5"
  },
  {
    "verse": "In all thy ways acknowledge him, and he shall direct thy paths.",
    "page": "Proverbs 3:6"
  },
  {
    "verse": "But they that wait upon the Lord shall renew their strength...",
    "page": "Isaiah 40:31"
  },
  {
    "verse": "Jesus wept.",
    "page": "John 11:35"
  },
  {
    "verse": "Thy word is a lamp unto my feet, and a light unto my path.",
    "page": "Psalm 119:105"
  },
  {
    "verse": "And we know that all things work together for good to them that love God...",
    "page": "Romans 8:28"
  },
  {
    "verse": "Be strong and of a good courage; be not afraid, neither be thou dismayed...",
    "page": "Joshua 1:9"
  },
  {
    "verse": "Create in me a clean heart, O God; and renew a right spirit within me.",
    "page": "Psalm 51:10"
  },
  {
    "verse": "Let everything that hath breath praise the Lord. Praise ye the Lord.",
    "page": "Psalm 150:6"
  },
  {
    "verse": "The Lord is my light and my salvation; whom shall I fear?",
    "page": "Psalm 27:1"
  },
  {
    "verse": "For I know the thoughts that I think toward you, saith the Lord...",
    "page": "Jeremiah 29:11"
  },
  {
    "verse": "This is the day which the Lord hath made; we will rejoice and be glad in it.",
    "page": "Psalm 118:24"
  },
  {
    "verse": "The name of the Lord is a strong tower: the righteous runneth into it, and is safe.",
    "page": "Proverbs 18:10"
  },
  {
    "verse": "Fear thou not; for I am with thee: be not dismayed; for I am thy God...",
    "page": "Isaiah 41:10"
  },
  {
    "verse": "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
    "page": "Matthew 11:28"
  },
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
  },
  {
    "verse": "For by grace are ye saved through faith; and that not of yourselves...",
    "page": "Ephesians 2:8"
  },
  {
    "verse": "And let us not be weary in well doing: for in due season we shall reap...",
    "page": "Galatians 6:9"
  },
  {
    "verse": "But my God shall supply all your need according to his riches in glory...",
    "page": "Philippians 4:19"
  },
  {
    "verse": "The Lord is nigh unto all them that call upon him...",
    "page": "Psalm 145:18"
  },
  {
    "verse": "O give thanks unto the Lord; for he is good...",
    "page": "Psalm 107:1"
  },
  {
    "verse": "He only is my rock and my salvation; he is my defence; I shall not be greatly moved.",
    "page": "Psalm 62:2"
  },
  {
    "verse": "Let us come before his presence with thanksgiving...",
    "page": "Psalm 95:2"
  },
  {
    "verse": "Call unto me, and I will answer thee, and show thee great and mighty things...",
    "page": "Jeremiah 33:3"
  },
  {
    "verse": "A new commandment I give unto you, That ye love one another...",
    "page": "John 13:34"
  },
  {
    "verse": "I am the way, the truth, and the life: no man cometh unto the Father, but by me.",
    "page": "John 14:6"
  },
  {
    "verse": "Even though I walk through the valley of the shadow of death, I will fear no evil...",
    "page": "Psalm 23:4"
  },
  {
    "verse": "We love him, because he first loved us.",
    "page": "1 John 4:19"
  },
  {
    "verse": "Humble yourselves therefore under the mighty hand of God, that he may exalt you...",
    "page": "1 Peter 5:6"
  },
  {
    "verse": "In the beginning God created the heaven and the earth.",
    "page": "Genesis 1:1"
  },
  {
    "verse": "The Lord is my shepherd; I shall not want.",
    "page": "Psalm 23:1"
  },
  {
    "verse": "For God so loved the world, that he gave his only begotten Son...",
    "page": "John 3:16"
  },
  {
    "verse": "I can do all things through Christ which strengtheneth me.",
    "page": "Philippians 4:13"
  },
  {
    "verse": "Trust in the Lord with all thine heart; and lean not unto thine own understanding.",
    "page": "Proverbs 3:5"
  },
  {
    "verse": "In all thy ways acknowledge him, and he shall direct thy paths.",
    "page": "Proverbs 3:6"
  },
  {
    "verse": "But they that wait upon the Lord shall renew their strength...",
    "page": "Isaiah 40:31"
  },
  {
    "verse": "Jesus wept.",
    "page": "John 11:35"
  },
  {
    "verse": "Thy word is a lamp unto my feet, and a light unto my path.",
    "page": "Psalm 119:105"
  },
  {
    "verse": "And we know that all things work together for good to them that love God...",
    "page": "Romans 8:28"
  },
  {
    "verse": "Be strong and of a good courage; be not afraid, neither be thou dismayed...",
    "page": "Joshua 1:9"
  },
  {
    "verse": "Create in me a clean heart, O God; and renew a right spirit within me.",
    "page": "Psalm 51:10"
  },
  {
    "verse": "Let everything that hath breath praise the Lord. Praise ye the Lord.",
    "page": "Psalm 150:6"
  },
  {
    "verse": "The Lord is my light and my salvation; whom shall I fear?",
    "page": "Psalm 27:1"
  },
  {
    "verse": "For I know the thoughts that I think toward you, saith the Lord...",
    "page": "Jeremiah 29:11"
  },
  {
    "verse": "This is the day which the Lord hath made; we will rejoice and be glad in it.",
    "page": "Psalm 118:24"
  },
  {
    "verse": "The name of the Lord is a strong tower: the righteous runneth into it, and is safe.",
    "page": "Proverbs 18:10"
  },
  {
    "verse": "Fear thou not; for I am with thee: be not dismayed; for I am thy God...",
    "page": "Isaiah 41:10"
  },
  {
    "verse": "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
    "page": "Matthew 11:28"
  },
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
  },
  {
    "verse": "For by grace are ye saved through faith; and that not of yourselves...",
    "page": "Ephesians 2:8"
  },
  {
    "verse": "And let us not be weary in well doing: for in due season we shall reap...",
    "page": "Galatians 6:9"
  },
  {
    "verse": "But my God shall supply all your need according to his riches in glory...",
    "page": "Philippians 4:19"
  },
  {
    "verse": "The Lord is nigh unto all them that call upon him...",
    "page": "Psalm 145:18"
  },
  {
    "verse": "O give thanks unto the Lord; for he is good...",
    "page": "Psalm 107:1"
  },
  {
    "verse": "He only is my rock and my salvation; he is my defence; I shall not be greatly moved.",
    "page": "Psalm 62:2"
  },
  {
    "verse": "Let us come before his presence with thanksgiving...",
    "page": "Psalm 95:2"
  },
  {
    "verse": "Call unto me, and I will answer thee, and show thee great and mighty things...",
    "page": "Jeremiah 33:3"
  },
  {
    "verse": "A new commandment I give unto you, That ye love one another...",
    "page": "John 13:34"
  },
  {
    "verse": "I am the way, the truth, and the life: no man cometh unto the Father, but by me.",
    "page": "John 14:6"
  },
  {
    "verse": "Even though I walk through the valley of the shadow of death, I will fear no evil...",
    "page": "Psalm 23:4"
  },
  {
    "verse": "We love him, because he first loved us.",
    "page": "1 John 4:19"
  },
  {
    "verse": "Humble yourselves therefore under the mighty hand of God, that he may exalt you...",
    "page": "1 Peter 5:6"
  },
  {
    "verse": "In the beginning God created the heaven and the earth.",
    "page": "Genesis 1:1"
  },
  {
    "verse": "The Lord is my shepherd; I shall not want.",
    "page": "Psalm 23:1"
  },
  {
    "verse": "For God so loved the world, that he gave his only begotten Son...",
    "page": "John 3:16"
  },
  {
    "verse": "I can do all things through Christ which strengtheneth me.",
    "page": "Philippians 4:13"
  },
  {
    "verse": "Trust in the Lord with all thine heart; and lean not unto thine own understanding.",
    "page": "Proverbs 3:5"
  },
  {
    "verse": "In all thy ways acknowledge him, and he shall direct thy paths.",
    "page": "Proverbs 3:6"
  },
  {
    "verse": "But they that wait upon the Lord shall renew their strength...",
    "page": "Isaiah 40:31"
  },
  {
    "verse": "Jesus wept.",
    "page": "John 11:35"
  },
  {
    "verse": "Thy word is a lamp unto my feet, and a light unto my path.",
    "page": "Psalm 119:105"
  },
  {
    "verse": "And we know that all things work together for good to them that love God...",
    "page": "Romans 8:28"
  },
  {
    "verse": "Be strong and of a good courage; be not afraid, neither be thou dismayed...",
    "page": "Joshua 1:9"
  },
  {
    "verse": "Create in me a clean heart, O God; and renew a right spirit within me.",
    "page": "Psalm 51:10"
  },
  {
    "verse": "Let everything that hath breath praise the Lord. Praise ye the Lord.",
    "page": "Psalm 150:6"
  },
  {
    "verse": "The Lord is my light and my salvation; whom shall I fear?",
    "page": "Psalm 27:1"
  },
  {
    "verse": "For I know the thoughts that I think toward you, saith the Lord...",
    "page": "Jeremiah 29:11"
  },
  {
    "verse": "This is the day which the Lord hath made; we will rejoice and be glad in it.",
    "page": "Psalm 118:24"
  },
  {
    "verse": "The name of the Lord is a strong tower: the righteous runneth into it, and is safe.",
    "page": "Proverbs 18:10"
  },
  {
    "verse": "Fear thou not; for I am with thee: be not dismayed; for I am thy God...",
    "page": "Isaiah 41:10"
  },
  {
    "verse": "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
    "page": "Matthew 11:28"
  },
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
  },
        ]



