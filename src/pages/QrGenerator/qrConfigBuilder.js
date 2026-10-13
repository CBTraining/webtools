/**
 * Builds standard configuration options for QRCodeStyling instance.
 */
export function buildQrStylingOptions({
  size,
  data,
  processedLogoUrl,
  errorCorrection,
  hideDotsBehindLogo,
  logoSize,
  logoMargin,
  dotType,
  isGradient,
  color1,
  color2,
  singleColor,
  isRounded,
  bgColor = 'transparent'
}) {
  return {
    width: size,
    height: size,
    data: data || ' ',
    image: processedLogoUrl || '',
    qrOptions: {
      errorCorrectionLevel: errorCorrection
    },
    imageOptions: {
      hideBackgroundDots: hideDotsBehindLogo,
      imageSize: logoSize,
      margin: logoMargin,
      crossOrigin: 'anonymous'
    },
    dotsOptions: {
      type: dotType,
      ...(isGradient ? {
        gradient: {
          type: 'linear',
          rotation: 0.785398, // 45 degrees
          colorStops: [
            { offset: 0, color: color1 },
            { offset: 1, color: color2 }
          ]
        }
      } : {
        gradient: null,
        color: singleColor
      })
    },
    cornersSquareOptions: {
      type: isRounded ? 'extra-rounded' : 'square'
    },
    backgroundOptions: {
      color: bgColor
    }
  };
}
