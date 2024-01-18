$(() => {
	// General
	$(".magazine-article-container").parent().css({
			"overflow-x": "hidden",
			"border": "1px solid #cccccc",
			"height": "711px", // 16:9
			"max-height": "100vh"
	}).parent().css({
			"height": "100vh",
			"max-height": "unset",
			"display": "flex",
			"flex-direction": "column",
			"justify-content": "center"
	});
	$(".top-box, .post-headline, .post-article").css("position", "static");
	$(".authorContainer").css("padding-top", "10px").insertAfter(".post-title");
	$(".top-box h3").css("padding-left", "10px").text($("title").text());

	$("title").text(`Preview "${$(".post-title h2").text()}"`)

	// No!!!!
	$(".removeContent").remove();

	// Fix embed
	$(".style-socials").html($(".style-socials").text()).css("margin", "20px 0");

	// And then I'd like to add a margin to the bottom but I just can't figure out how
});