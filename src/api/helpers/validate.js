

const isValidURL = (str) => {
    const regex =
      /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if (!regex.test(str)) {
      return false;
    }
    return true;
  }

  const isBase64 = (value) => {
    const base64ImageRegex = /^data:image\/(jpeg|jpg|png|gif);base64,/;
    return base64ImageRegex.test(value);
  };

  const getFirstLetters = (inputString) => {
    const words = inputString.split(" ");
    const firstLetters = words.map(word => word.charAt(0)).join("");
    return firstLetters;
  }

  
module.exports = {
    isBase64,
    isValidURL,
    getFirstLetters
}

