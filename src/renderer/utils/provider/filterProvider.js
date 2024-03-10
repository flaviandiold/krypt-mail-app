export default function OnFilterSelection(selected, Data) {
  // console.log(localStorage);
  if (Data) {
    if (selected) {
      switch (selected) {
        case "A-Z":
          Data.sort((a, b) =>
            a.from[0].address.localeCompare(b.from[0].address)
          );
          break;
        case "Z-A":
          Data.sort((a, b) =>
            a.from[0].address.localeCompare(b.from[0].address)
          )?.reverse();
          break;
        case "Newest":
          Data.sort((a, b) => {
            // console.log(a);
            return new Date(b.date) - new Date(a.date);
          });
          break;
        case "Oldest":
          Data.sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
          });
          break;
        default:
          break;
      }
    }
  } else {
    throw new Error("No valid filter data provided");
  }
}

export function filterByText(text, Data) {
  text = text.toLowerCase();
  if (!Data) {
    return;
  }
  return Data.filter((a) => {
    const fromNameArr = a.from[0].name.toLowerCase().split(" ");
    const fromAddress = a.from[0].address;
    const subjectArr = a?.subject?.toLowerCase()?.split(" ");
    if (fromAddress.toLowerCase().includes(text)) return true;
    fromNameArr.find((value) => {
      if (value.includes(text)) return true;
    });
    let isTrue = false;
    if (subjectArr?.length > 0) {
      subjectArr.find((value) => {
        if (value.includes(text)) isTrue = true;
      });
    }
    return isTrue;
  });
}
