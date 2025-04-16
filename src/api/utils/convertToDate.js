const convertToDate = async(getdate) => {

    var dd = getdate.split('-');
    var newdate = new Date(dd[2], dd[1] - 1, dd[0]);
    console.log(newdate);
    return newdate;

}

module.exports = { convertToDate };
