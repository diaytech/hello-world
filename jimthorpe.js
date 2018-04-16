//MEMBER LOGIN
import wixUsers from 'wix-users';
import wixData from 'wix-data';
import wixLocation from 'wix-location';
import {local} from 'wix-storage';
var newUser, userId, userEmail;
$w.onReady(() => {

	if (wixUsers.currentUser.loggedIn) {
		$w("#buttonLogin").label = "Logout";
		$w("#buttonProfile").show();
		wixUsers.currentUser.getEmail().then((email) => userEmail = email);
	} else {
		$w("#buttonLogin").label = "Login";
		$w("#buttonProfile").hide();
	}
});

export function buttonLogin_click(event, $w) {
	// user is logged in
	if (wixUsers.currentUser.loggedIn) {
		// log the user out
		wixUsers.logout()
			.then(() => {
				// update buttons accordingly
				$w("#buttonLogin").label = "Login";
				$w("#buttonProfile").hide();
			});
	}
	// user is logged out
	else {
		// prompt the user to log in 
		wixUsers.promptLogin({
				"mode": "login"
			})
			.then((user) => {
				userId = user.id;
				//console.log(userId);
				return user.getEmail();
			})
			.then((email) => {
				// check if there is an item for the user in the collection
				userEmail = email;
				local.setItem("userEmail", userEmail);
				//console.log(userEmail);
				return wixData.query("MemberProfile")
					.eq("businessEmail", userEmail)
					.find();
			})
			.then((results) => {
				// if an item for the user is not found
				if (results.items.length === 0) {
					// create an item
					newUser = true;
					const toInsert = {
						"_id": userId,
						"businessEmail": userEmail
					};
					// add the item to the collection
					wixData.insert("MemberProfile", toInsert)
						.catch((err) => {
							console.log(err);
						});
				}
				// update buttons accordingly
				$w("#buttonLogin").label = "Logout";
				$w("#buttonProfile").show();
			})
			.catch((err) => {
				console.log(err);
			});
	}
}

export function buttonProfile_click(event, $w) {
	if (!newUser) {
		wixLocation.to(`/MemberProfile/${userEmail}`);
	} else {
		wixLocation.to(`/upload-listing`);
	}
}

/*************************************/

//CREATE SPECIAL
import wixUsers from 'wix-users';
import wixData from 'wix-data';
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

var userEmail, userBusinessName, specialImage;

$w.onReady(function () {
	if (wixWindow.rendering.renderCycle === 1) {
		let user = wixUsers.currentUser;
		user.getEmail()
			.then((email) => {
				userEmail = email; // "user@something.com"
				//console.log(userEmail);
			})
			.then(() => {
				wixData.query("MemberProfile")
					.eq("businessEmail", userEmail)
					.find()
					.then((results) => {
						userBusinessName = results.items[0].businessName;
						//console.log(userBusinessName);
						$w('#inputBusinessName').value = userBusinessName;
					});
			});
	}

});

export function buttonSubmit_click(event, $w) {
	if ($w("#uploadSpecialImage").value.length > 0) { // user chose a file
		$w("#textFailInsert").hide();
		$w('#uploadSpecialImage').startUpload().then((uploadedFile) => {
				specialImage = uploadedFile.url;
				//console.log(specialImage);
			})
			.catch((uploadError) => {
				console.log(`File upload error: ${uploadError.errorCode}`);
				console.log(uploadError.errorDescription);
			}).then(() => {
				let toInsert = {
					//"title": "Mr.",
					"specialName": $w("#inputSpecialName").value,
					"businessName": userBusinessName,
					"image": specialImage,
					"website": $w("#inputURL").value,
					"description": $w("#textSpecialDescription").value,
					"startDate": $w("#dateStart").value,
					"endDate": $w("#dateEnd").value,
					"businessEmail": userEmail,
					"adminApproved": false
				};

				wixData.insert("MemberSpecials", toInsert).then((item)=>wixLocation.to("/MemberSpecials/"+item._id));
			})
			.catch((err) => {
				console.log("Error on Insert: " + err);
			});
	} else { // user clicked button but didn't chose a file
		$w("#textFailInsert").show();
	}
}

/*************************************/

//CREATE AD
import wixUsers from 'wix-users';
import wixData from 'wix-data';
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

var userEmail, userBusinessName, adImage;

$w.onReady(function () {
	if (wixWindow.rendering.renderCycle === 1) {
		let user = wixUsers.currentUser;
		user.getEmail()
			.then((email) => {
				userEmail = email;
			})
			.then(() => {
				wixData.query("MemberProfile")
					.eq("businessEmail", userEmail)
					.find()
					.then((results) => {
						userBusinessName = results.items[0].businessName;
					});
			});
	}

});

export function buttonSubmit_click(event, $w) {
	if ($w("#uploadAdImage").value.length > 0) { // user chose a file
		$w("#textFailInsert").hide();
		$w('#uploadAdImage').startUpload().then((uploadedFile) => {
				adImage = uploadedFile.url;
			})
			.catch((uploadError) => {
				console.log(`File upload error: ${uploadError.errorCode}`);
				console.log(uploadError.errorDescription);
			}).then(() => {
				let toInsert = {
					"image": adImage,
					"url": $w("#inputURL").value,
					"businessEmail": userEmail,
					"businessName": userBusinessName,
					"adminApproved": false
				};

				wixData.insert("BannerAds", toInsert).then((item) => wixLocation.to("/BannerAds/" + item._id));
			})
			.catch((err) => {
				console.log("Error on Insert: " + err);
			});
	} else { // user clicked button but didn't chose a file
		$w("#textFailInsert").show();
	}
}

/*************************************/

//RANDOM SPECIALS
import wixData from 'wix-data';
import wixWindow from 'wix-window';
import {shuffle, formatDate} from 'public/functions.js';

var items;

$w.onReady(function () {

	if (wixWindow.rendering.renderCycle === 1) {
		randomizer();
	}

});

export function randomizer() {
	//Add your code for this event here: 
	var today = new Date();
	wixData.query("MemberSpecials")
		.ascending("startDate")
		.le("startDate", today)
		.ge("endDate", today)
		.eq("adminApproved", true)
		.find()
		.then((results) => {
			items = results.items;
			items = shuffle(items);
			$w('#specialsRepeater').data = items;
		})
		.then(() => {
			$w('#specialsRepeater').forEachItem(($w, itemData, index) => {
				$w('#imageRepeater').src = itemData.image;
				wixData.get("MemberProfile", itemData.reference).then((results) => $w('#textBusinessName').text = results.businessName);
				$w('#textSpecialDescritpion').text = itemData.description;
				$w("#textSpecialName").text = itemData.specialName;
				$w('#textStartDate').text = formatDate(itemData.startDate);
				$w('#textEndDate').text = formatDate(itemData.endDate);
				if (itemData.website) $w('#buttonRepeater').hide();
			});
			$w("#preloader").hide();
			$w('#specialsRepeater').show()
		})
		.catch((error) => {
			console.log("Error Message: " + error.message);
			console.log("Error Code: " + error.code);
		});;
}

/*************************************/

//RANDOM BUSINESS
// For full API documentation, including code examples, visit http://wix.to/94BuAAs

import wixData from 'wix-data';
import wixWindow from 'wix-window';
import {
	shuffle, formatDate
}
from 'public/functions.js';

var i = 0,
	items, galleryItems = [];

const //websiteURL = "image://v1/2e2561_5b8f9e76841f4d40951ed5d7afcd1b3d~mv2.png/512_512/link-symbol.png",
	facebook = "image://v1/2e2561_fe11f09513354d8491368bde52c565b2~mv2.png/512_512/facebook.png",
	twitter = "image://v1/2e2561_6a94f33ab0944a128229acf03833e807~mv2.png/512_512/twitter.png",
	instagram = "image://v1/2e2561_b0ef16b9f6364614891863679f5c56bb~mv2.png/512_512/instagram.png";

$w.onReady(function () {
	if (wixWindow.rendering.renderCycle === 1) {
		var today = new Date();
		randomizer();
		wixData.query("BannerAds")
			.le("startDate", today)
			.ge("endDate", today)
			.eq("adminApproved", true)
			.find()
			.then((results) => {
				items = results.items;
				items = shuffle(items);
				console.log(items);
				$w("#gallery").items = [];
				galleryItems = $w("#gallery").items;
				for (var n in items) {
					galleryItems.push({
						"src": items[n].image,
						//"description": "Description",
						//"title": "Title"
					});
				}
				$w("#gallery").items = galleryItems;

			});
	}
});

export function businessesRepeater_itemReady($w, itemData, index) {
	//Add your code for this event here: 
	$w('#icon1').hide();
	$w('#icon2').hide();
	$w('#icon3').hide();
	$w("#buttonWebsite").hide();
	i = 0;
	if (itemData.businessWebsite) {
		$w("#buttonWebsite").show();
		$w("#buttonWebsite").link = itemData.businessWebsite;
	}
	if (itemData.businessFacebook) {
		i++;
		$w("#icon" + i.toString()).show();
		$w("#icon" + i.toString()).src = facebook;
		$w("#icon" + i.toString()).tooltip = "";
		$w("#icon" + i.toString()).link = itemData.businessFacebook;
		if (itemData.businessTwitter) {
			i++;
			$w("#icon" + i.toString()).show();
			$w("#icon" + i.toString()).src = twitter;
			$w("#icon" + i.toString()).tooltip = "";
			$w("#icon" + i.toString()).link = itemData.businessTwitter;
			if (itemData.businessInstagram) {
				i++;
				$w("#icon" + i.toString()).show();
				$w("#icon" + i.toString()).src = instagram;
				$w("#icon" + i.toString()).tooltip = "";
				$w("#icon" + i.toString()).link = itemData.businessInstagram;

			}
		}

	} else {
		if (itemData.businessTwitter) {
			i++;
			$w("#icon" + i.toString()).show();
			$w("#icon" + i.toString()).src = twitter;
			$w("#icon" + i.toString()).tooltip = "";
			$w("#icon" + i.toString()).link = itemData.businessTwitter;
			if (itemData.businessInstagram) {
				i++;
				$w("#icon" + i.toString()).show();
				$w("#icon" + i.toString()).src = instagram;
				$w("#icon" + i.toString()).tooltip = "";
				$w("#icon" + i.toString()).link = itemData.businessInstagram;
			}
		} else {
			if (itemData.businessInstagram) {
				i++;
				$w("#icon" + i.toString()).show();
				$w("#icon" + i.toString()).src = instagram;
				$w("#icon" + i.toString()).tooltip = "";
				$w("#icon" + i.toString()).link = itemData.businessInstagram;
			}
		}

	}

}

export function randomizer() {
	//Add your code for this event here: 
	wixData.query("MemberProfile")
		.ascending("_id")
		.find()
		.then((results) => {
			items = results.items;
			items = shuffle(items);
			$w('#businessesRepeater').data = items;
		})
		.then(() => {
			$w('#businessesRepeater').forEachItem(($w, itemData, index) => {
				$w('#imageRepeater').src = itemData.mainImage;
				$w('#textBusinessName').text = itemData.businessName;
				$w('#textBusinessDescritpion').text = itemData.description;
				$w("#preloader").hide();
				$w('#businessesRepeater').show();
			});
		})
		.catch((error) => {
			console.log("Error Message: " + error.message);
			console.log("Error Code: " + error.code);
		});
}

/*************************************/

//MEMBER PROFILE
import wixUsers from 'wix-users';
import wixData from 'wix-data';
import wixWindow from 'wix-window';
var specialId, userEmail, items;

$w.onReady(function () {
	if (wixWindow.rendering.renderCycle === 1) {
		wixUsers.currentUser.getEmail()
			.then((email) => {
				userEmail = email;
			})
			.then(() => wixData.query("MemberSpecials").eq("businessEmail", userEmail).find())
			.then((results) => {
				items = results.items[0];
				console.log(items);
				if (items.length === 0) {
					$w('#buttonSpecial').label = "Create Special";
					$w('#buttonSpecial').link = "/memberspecials";
				} else {
					specialId = items._id;
					$w('#buttonSpecial').label = "View Special";
					$w('#buttonSpecial').link = `/MemberSpecials/${specialId}`;
				}
			})
			.catch((error) => {
				$w('#buttonSpecial').label = "Create Special";
				$w('#buttonSpecial').link = "/memberspecials";
				console.log("Error Message: " + error.message);
				console.log("Error Code: " + error.code);
			})
			.then(() => wixData.query("BannerAds").eq("businessEmail", userEmail).find())
			.then((results) => {
				items = results.items[0];
				console.log(items);
				if (items.length === 0) {
					$w('#buttonAd').label = "Create Ad";
					$w('#buttonAd').link = "/memberads";
				} else {
					specialId = items._id;
					$w('#buttonAd').label = "View Ad";
					$w('#buttonAd').link = `/BannerAds/${specialId}`;
				}
			})
			.catch((error) => {
				$w('#buttonAd').label = "Create Ad";
				$w('#buttonAd').link = "/memberads";
				console.log("Error Message: " + error.message);
				console.log("Error Code: " + error.code);
			});

	}

});

/*************************************/

//MEMBER PROFILE UPDATE
// For full API documentation, including code examples, visit http://wix.to/94BuAAs

$w.onReady(function () {
	//TODO: write your page related code here...
	$w('#dynamicDataset').onReady(() => {
		//console.log($w('#dynamicDataset').getCurrentItem().businessState);
		//$w('#dropdownState').value = $w('#dynamicDataset').getCurrentItem().businessState;
		//console.log($w('#dropdown1').value);
	});

});

export function buttonUpload_click(event, $w) {
	$w('#imageUpload').hide();
	$w('#preloader').show();
	$w('#uploadImage').startUpload().then((uploadedFile) => {
		$w('#imageUpload').src = uploadedFile.url;
		$w('#preloader').hide();
		$w('#imageUpload').show();
	}).catch((uploadError) => {
		console.log(`File upload error: ${uploadError.errorCode}`);
		console.log(uploadError.errorDescription);
	});
}

/*************************************/

//MEMBER SPECIALS UPDATE
// For full API documentation, including code examples, visit http://wix.to/94BuAAs

$w.onReady(function () {
	//TODO: write your page related code here...

});

export function buttonUploadImage_click(event, $w) {
	$w('#uploadImage').startUpload().then((uploadedFile) => {
		$w('#imageUpload').src = uploadedFile.url;
	}).catch((uploadError) => {
		console.log(`File upload error: ${uploadError.errorCode}`);
		console.log(uploadError.errorDescription);
	});
}

/*************************************/

//MEMBER SPECIALS
import wixLocation from 'wix-location';
import wixUsers from 'wix-users';
import {
	formatDate
}
from 'public/functions.js';
var userEmail;


$w.onReady(function () {

});

export function dynamicDataset_ready() {
	let itemData = $w("#dynamicDataset").getCurrentItem();
	$w('#textStartDate').text = formatDate(itemData.startDate);
	$w('#textEndDate').text = formatDate(itemData.endDate);
	if (itemData.adminApproved) {
		console.log(itemData.adminApproved);
		$w('#textApproval').text = "Confirmed";
	} else {
		console.log(itemData.adminApproved);
		$w('#textApproval').text = "Pending";
	}
	wixUsers.currentUser.getEmail()
	.then((email) => userEmail = email)
	.then(() =>	$w('#buttonBack').link = "/MemberProfile/" + userEmail);
}

export function buttonDelete_click(event, $w) {
	wixUsers.currentUser.getEmail().then((email) => {
			userEmail = email;
			$w("#dynamicDataset").remove();
		})
		.then(() => {
			wixLocation.to("/MemberProfile/" + userEmail);
		});
	
}

/*************************************/

//ADMIN MEMBER SPECIALS
import wixData from 'wix-data';
import wixWindow from 'wix-window';
import {
	formatDate
}
from 'public/functions.js';


var items;

$w.onReady(function () {
	if (wixWindow.rendering.renderCycle === 1) {
		wixData.query("MemberSpecials")
			.descending("startDate")
			.find()
			.then((results) => {
				items = results.items;
				$w('#specialsRepeater').data = items;
			})
			.then(() => {
				$w('#specialsRepeater').forEachItem(($w, itemData, index) => {
					$w('#imageRepeater').src = itemData.image;
					$w('#textBusinessName').text = itemData.businessName;
					$w('#switchAdminApproval').checked = itemData.adminApproved;
					$w("#textSpecialName").text = itemData.specialName;
					$w('#textStartDate').text = formatDate(itemData.startDate);
					$w('#textEndDate').text = formatDate(itemData.endDate);
					$w("#preloader").hide();
					$w('#groupSpecials').show();
				});
			})
			.catch((error) => {
				console.log("Error Message: " + error.message);
				console.log("Error Code: " + error.code);
			});
	}
});

export function buttonSubmit_click(event, $w) {
	$w('#specialsRepeater').forEachItem(($w, itemData, index) => {
		//console.log("Switch:"+$w('#switchAdminApproval').checked);
		//console.log("ItemData:"+itemData.adminApproved);
		if ($w('#switchAdminApproval').checked !== itemData.adminApproved) {
			itemData.adminApproved = $w('#switchAdminApproval').checked;
			wixData.update("MemberSpecials", itemData)
				.then(() => {
					$w('#textFail').hide();
					$w('#textSuccess').show();
					//console.log("Changes Submitted");
				}).catch((error) => {
					$w('#textSuccess').hide();
					$w('#textFail').show();
					console.log("Error Message: " + error.message);
					console.log("Error Code: " + error.code);
				});
		}
	});

}

export function specialsRepeater_mouseIn(event, $w) {
	$w('#textSuccess').hide();
	$w('#textFail').hide();
}

/*************************************/

//ADMIN ADS
import wixData from 'wix-data';
import wixWindow from 'wix-window';
import {
	formatDate
}
from 'public/functions.js';


var items;

$w.onReady(function () {
	if (wixWindow.rendering.renderCycle === 1) {
		wixData.query("BannerAds")
			.descending("startDate")
			.find()
			.then((results) => {
				items = results.items;
				$w('#specialsRepeater').data = items;
			})
			.then(() => {
				$w('#specialsRepeater').forEachItem(($w, itemData, index) => {
					$w('#buttonEdit').link = "/admin/ads/"+itemData._id;
					$w('#imageRepeater').src = itemData.image;
					$w('#textBusinessName').text = itemData.businessName;
					$w('#switchAdminApproval').checked = itemData.adminApproved;
					$w("#textSpecialName").text = itemData.url;
					$w('#textStartDate').text = formatDate(itemData.startDate);
					$w('#textEndDate').text = formatDate(itemData.endDate);
					$w("#preloader").hide();
					$w('#groupSpecials').show();
				});
			})
			.catch((error) => {
				console.log("Error Message: " + error.message);
				console.log("Error Code: " + error.code);
			});
	}
});

export function specialsRepeater_mouseIn(event, $w) {
	$w('#textSuccess').hide();
	$w('#textFail').hide();
}

export function buttonSubmit_click(event, $w) {
	$w('#specialsRepeater').forEachItem(($w, itemData, index) => {
		if ($w('#switchAdminApproval').checked !== itemData.adminApproved) {
			itemData.adminApproved = $w('#switchAdminApproval').checked;
			wixData.update("BannerAds", itemData)
				.then(() => {
					$w('#textFail').hide();
					$w('#textSuccess').show();
					//console.log("Changes Submitted");
				}).catch((error) => {
					$w('#textSuccess').hide();
					$w('#textFail').show();
					console.log("Error Message: " + error.message);
					console.log("Error Code: " + error.code);
				});
		}
	}); 
}

/*************************************/

//BANNER ADS
import wixUsers from 'wix-users';
import {
	formatDate
}
from 'public/functions.js';
var userEmail;

$w.onReady(function () {
	//TODO: write your page related code here...

});

export function dynamicDataset_ready() {
	let itemData = $w("#dynamicDataset").getCurrentItem();
	$w('#textStartDate').text = formatDate(itemData.startDate);
	$w('#textEndDate').text = formatDate(itemData.endDate);
	if (itemData.adminApproved) {
		console.log(itemData.adminApproved);
		$w('#textApproval').text = "Confirmed";
	} else {
		console.log(itemData.adminApproved);
		$w('#textApproval').text = "Pending";
	}
	wixUsers.currentUser.getEmail()
	.then((email) => userEmail = email)
	.then(() =>	$w('#buttonBack').link = "/MemberProfile/" + userEmail); 
}

/*************************************/

//FUNCTIONS
// Filename: public/randomizer.js 

export function shuffle(arra1) {
    var ctr = arra1.length, temp, index;

// While there are elements in the array
    while (ctr > 0) {
// Pick a random index
        index = Math.floor(Math.random() * ctr);
// Decrease ctr by 1
        ctr--;
// And swap the last element with it
        temp = arra1[ctr];
        arra1[ctr] = arra1[index];
        arra1[index] = temp;
    }
    return arra1;
}

export function formatDate(date) {
	var dd = date.getDate();
	var mm = date.getMonth() + 1; //January is 0!
	var yyyy = date.getFullYear();
	if (dd < 10) {
		dd = '0' + dd;
	}

	if (mm < 10) {
		mm = '0' + mm;
	}

	return date = mm + '/' + dd + '/' + yyyy;
}


