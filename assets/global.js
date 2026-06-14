let images = gsap.utils.toArray(".avi-image img");

images.forEach((image)=>{
    gsap.set(image, {scale:1.2});
    gsap.to(image,{
        scale:1,
        scrollTrigger:{
                trigger: image,
                pin:false,
                markers:false,
                scrub:1
                }
    })    
    })