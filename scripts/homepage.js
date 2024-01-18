$(() => {
	$("#school-title").text("Høje Taastrup Gymnasium").css({"text-align": "center", "margin-left": "unset"});
	$("a[href=\"e9a/htg\"] img").css({"background-color": "#466e64", "padding": "20px 0"});

	$(".message-bubble").css("background-color", "#ffffff");
	$(".message-head").css("margin-bottom", "5px");
	$(".message-head button").remove();
	$(".message-body").css({"height": "100%", "overflow": "unset"}).find("p:eq(1)").remove();
	$(".message h4, .message p").css({"width": "100%", "text-align": "center"});
});