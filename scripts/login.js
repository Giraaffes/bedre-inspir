$(() => {
	$(".col-sm-12").css({
			"padding-left": "30px",
			"padding-right": "30px"
	});
	$(".sign-in-block").css({
			"padding": "unset",
			"width": "440px"
	});

	$("input[name=\"query\"]").attr("placeholder", "E-MAIL");

	let loginButton = $("input[type=\"submit\"]");
	loginButton.attr("style", loginButton.attr("style") + " !important;").val("LOG IND");

	let signupButton = $("a[href=\"/member/register\"] label");
	signupButton.on("mouseover", () => {
			signupButton.css({
					"cursor": "pointer",
					"background-color": "#dddddd"
			});
	}).on("mouseout", () => {
			signupButton.css({
					"cursor": "default",
					"background-color": "unset"
			});
	});
});