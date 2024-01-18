// Always only show local articles
let urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("type") != "local") {
    urlParams.set("type", "local");
    window.location.replace(window.location.origin + window.location.pathname + "?" + urlParams.toString());
    //return;
}


// Disable default DataTable initialization
// This may seem a bit strange, but all I'm doing is removing the first line of a specific script in the body which usually initializes the DataTable.
let overrideOnNext = -1;
(new MutationObserver((records, observer) => {
    for (let record of records) {
        let script = Array.from(record.addedNodes).filter(e => $(e).is("script"))[0];
        if (script) {
            if (overrideOnNext == 0) { // The specific script is 2 scripts after the one with src="/js/custom.js"
                $(script).html($(script).html().replace("initDataTable();", ""));
            } else if ($(script).attr("src") == "/js/custom.js") {
                overrideOnNext = 2;
            }
            if (overrideOnNext >= 0) overrideOnNext--;
        }
    }
})).observe(document, { childList: true, subtree: true });

// (Old function for this which doesn't work for chrome)
/*$(document).on("beforescriptexecute", e => {
   if ($(e.target).html().trim().startsWith("initDataTable();")) {
       window.initDataTable = function() {}
   }
});*/


// https://stackoverflow.com/a/26915856
function getUuid1Date(uuid) {
    let splitUuid = uuid.split("-");
    let time = parseInt(`${splitUuid[2].slice(1)}${splitUuid[1]}${splitUuid[0]}`, 16);
    var timeMillis = Math.floor((time - 122192928000000000) / 10000);
    return new Date(timeMillis);
};

function padNum(num, length) {
    return num.toString().padStart(2, '0');
}

function capitalize(str) {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
}

function formatDate(date) {
    //let weekday = date.toLocaleString("da-DK", {weekday: "long"});
    // `${weekday} d. ...`
    return capitalize(`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} kl ${date.getHours()}:${padNum(date.getMinutes(), 2)}`);
}


const deleteButtonStyles = {
    default: {
        "color": "#ffffff",
        "background-color": "#dc3545",
        "border-color": "#dc3545"
    },
    hover: {
        "background-color": "#bf2232",
        "border-color": "#ad1f2d"
    },
    click: {
        "background-color": "#ad1f2d",
        "border-color": "#981b27"
    }
};

function addDeleteButton(row, pageUuid, articleUuid) {
    let deleteButton = $("<button class=\"btn\">Slet</button>").appendTo($(row).find("td:eq(5)"));
    deleteButton.css(deleteButtonStyles.default).on("mouseover", () => {
        deleteButton.css(deleteButtonStyles.hover);
    }).on("focus", () => {
        deleteButton.css(deleteButtonStyles.click);
    }).on("mouseout", () => {
        deleteButton.css(deleteButtonStyles.default);
    });

    let articleName = $(row).find("td:eq(0)").text().trim();
    deleteButton.on("click", event => {
        if (!window.confirm(`Er du sikker på, at du vil slette artiklen "${articleName}" permanent?`)) return;

        let formData = new FormData();
        formData.append("uuid", articleUuid);
        fetch(`/admin/articles/delete-article/${pageUuid}`, {
            method: "POST",
            body: formData,
        }).then(res => res.json()).then(data => {
            if (data.status == "success") {
                $(event.target).closest("tr").remove();
                $.notify(`Artiklen "${articleName}" blev slettet`, "success");
            } else {
                $.notify("Kunne ikke slette artikel", "error");
            }
        });
    });
}

const visibilityButtonStyles = {
    default: {
        "color": "#000000",
        "background-color": "transparent",
        "border-color": "#17a2b8",
        "border-width": "2px",
        "cursor": "default"
    },
    hover: {
        "background-color": "#138496",
        "border-color": "#117a8b",
        "color": "#ffffff",
        "cursor": "pointer"
    },
    click: {
        "background-color": "#117a8b",
        "border-color": "#10707f",
        "color": "#ffffff"
    },
    current: {
        "color": "#ffffff",
        "background-color": "#17a2b8",
        "border-color": "#17a2b8",
        "cursor": "default"
    }
};

// There once existed the mythical statuses "inactive" and "draft"
// Until the creator of this plugin found out that they're literally no different
// And so they were combined into "ikke offentlig"
function addVisibilityButtons(row, pageUuid) {
    let visibilityButton = $("<button class=\"btn\"></button>")
    let wrapper = $("<div></div>").css({ // Need a wrapper cause of some stupid bug
        "display": "flex",
        "gap": "5px"
    });
    wrapper.appendTo($(row).find("td:eq(4)")).append(
        visibilityButton.clone().text("Offentlig"),
        visibilityButton.clone().text("Ikke offentlig"),
        //visibilityButton.clone().text("Deaktiveret")
    );

    let articleName = $(row).find("td:eq(0)").text().trim();
    let articleUuid = $(row).attr("data-article-uuid");
    wrapper.children().each((i, btn) => {
        $(btn).css(visibilityButtonStyles.default).on("mouseover", () => {
            if ($(btn).hasClass("current")) return;
            $(btn).css(visibilityButtonStyles.hover);
        }).on("focus", () => {
            if ($(btn).hasClass("current")) return;
            $(btn).css(visibilityButtonStyles.click);
        }).on("mouseout", () => {
            if ($(btn).hasClass("current")) return;
            $(btn).css(visibilityButtonStyles.default);
        });

        $(btn).on("click", () => {
            if ($(btn).hasClass("current")) return;

            let formData = new FormData();
            formData.append("uuid", articleUuid);
            formData.append("action", (["active", "inactive"])[i]);
            fetch(`/admin/articles/change-status/${pageUuid}`, {
                method: "POST",
                body: formData,
            }).then(res => {
                if (res.ok) {
                    $.notify(`Artiklen "${articleName}" blev sat til '${$(btn).text().trim()}'`, "success");
                    $(row).find("td:eq(4) button.current").removeClass("current").css(visibilityButtonStyles.default);
                    $(btn).addClass("current").css(visibilityButtonStyles.current);
                } else {
                    $.notify("Kunne ikke ændre på artiklens synlighed", "error");
                }
            });
        });
    });
}

// According to legend, the creator used this wonky method to tame the two beasts
/*function handleVisibilityButtons(row, editFormNode) {
    let articleName = $(row).find("td:eq(0)").text().trim();
    let editLink = $(row).data("edit-link");

    $(row).find("td:eq(4) button").each((i, btn) => {
        $(btn).on("click", () => {
            if ($(btn).hasClass("current")) return;

            let formData = new FormData(editFormNode);
            formData.set("status", (["active", "draft", "inactive"])[i]);
            fetch(editLink, {
                method: "POST",
                body: formData
            }).then(res => {
                if (res.ok) {
                    $.notify(`Artiklen "${articleName}" blev sat til '${$(btn).text().trim()}'`, "success");
                    $(row).find("td:eq(4) button.current").removeClass("current").css(visibilityButtonStyles.default);
                    $(btn).addClass("current").css(visibilityButtonStyles.current);
                } else {
                    $.notify("Kunne ikke ændre på artiklens synlighed", "error");
                }
            });
        });
    });
}*/

const editButtonStyles = {
    default: {
        "color": "#ffffff",
        "background-color": "#36ad5b",
        "border-color": "#36ad5b",
        "cursor": "default",
        "height": "100%" // Important because of the anchor
    },
    hover: {
        "background-color": "#2b8848",
        "border-color": "#25743e",
        "cursor": "pointer"
    },
    click: {
        "background-color": "#25743e",
        "border-color": "#1f6134"
    }
};

function addEditButton(row) {
    let editButton = $("<button class=\"btn btn-info\">Rediger</button>");
    editButton.css(editButtonStyles.default).on("mouseover", () => {
        editButton.css(editButtonStyles.hover);
    }).on("focus", () => {
        editButton.css(editButtonStyles.click);
    }).on("mouseout", () => {
        editButton.css(editButtonStyles.default);
    });

    let editLink = $(row).data("edit-link");
    let editAnchor = $(`<a href="${editLink}"></a>`).append(editButton);
    editAnchor.insertAfter($(row).find("td:eq(5) button:eq(0)"))
}

const updateOrderButtonStyles = {
    default: {
        "border-width": "2px",
        "background-color": "transparent",
        "color": "#222222",
        "border-color": "#007bff"
    },
    hover: {
        "background-color": "#0069d9",
        "border-color": "#0062cc",
        "color": "#ffffff"
    },
    click: {
        "background-color": "#0062cc",
        "border-color": "#005cbf"
    }
}

function addUpdateOrderButton(pageUuid, dataTable) {
    // It's actually gonna be an anchor and not a button, but I can't be bothered to change the style
    // For this reason i also can't use the 'focus' event for click style
    let newArticleButton = $(".admin-section-title .btn");
    let updateOrderButton = newArticleButton.clone().insertAfter(newArticleButton).text("Opdater rækkefølge (dette kan tage lang tid)");
    updateOrderButton.css(updateOrderButtonStyles.default).on("mouseover mouseup", () => {
        updateOrderButton.css(updateOrderButtonStyles.hover);
    }).on("mousedown", () => {
        updateOrderButton.css(updateOrderButtonStyles.click);
    }).on("mouseout", () => {
        updateOrderButton.css(updateOrderButtonStyles.default);
    });

    updateOrderButton.removeAttr("href").on("click", () => {
        $.notify("Opdaterer...", "warn");

        let rows = $("#table tbody tr").toArray();
        rows.sort((a, b) => {
            let aTime = dataTable.cell(a, 2).data();
            let bTime = dataTable.cell(b, 2).data();
            return aTime - bTime;
        });

        (async () => {
            for (let row of rows) {
                let articleName = $(row).find("td:eq(0)").text();
                let articleUuid = $(row).attr("data-article-uuid");
                let currentVisibilityButton = $(row).find("td:eq(4) button.current");

                let formData = new FormData();
                formData.append("uuid", articleUuid);
                formData.append("action", (["active", "inactive"])[currentVisibilityButton.index()]);
                await fetch(`/admin/articles/change-status/${pageUuid}`, {
                    method: "POST",
                    body: formData,
                });
                await new Promise((res, rej) => { setTimeout(res, 750); });
                $.notify(`Artiklen "${articleName}" opdateret!`, "success");
            }
        })();
    });
}

const categoryIcons = {
    "Inspir": "brain",
    "Nyt": "exclamation",
    "FAQ": "heart",
    "Academy": "graduation-cap",
    "Kalender": "calendar-alt",
    "Mødesteder": "users",
    "Hacks": "lightbulb",
    "Folk": "user"
};

function onReady() {
    let isChefredaktør = $("button:contains('GLOBAL')").length > 0;
    if (!isChefredaktør) return;

    let pageUuid = window.location.pathname.match(/[\w-]+$/)[0];

    $("head").append(`<style>
.notifyjs-container { font-size: 24px; padding: 10px; }
.nav-item { transition: background-color 0.15s ease-in; }
.nav-item:hover { background-color: #eeeeee; }
.nav-item:active { background-color: #dddddd; }
td .fas { width: 16px; text-align: center; }
</style>`);
    $(".alert").remove();

    // General changes
    let skolebladTitle = $("h3").text().toUpperCase();
    $("title").text(`${skolebladTitle} - Redaktør`);
    $("h3").text(`Skolebladet '${skolebladTitle}'`).css({"font-weight": "400", "margin-right": "7px"});
    $("br").remove();

    $(".admin-section-title").css("margin", "16px 0 24px 0");
    $(".admin-section-title .btn").text("+ Ny artikel").css("border-width", "2px");
    $("<p><- Hvad? Hold musen over mig</p>").insertAfter(".admin-section-title .btn").attr("title",
        "Normalt står artikler inde på skolebladet i rækkefølge efter hvornår de sidst blev ændret.\nTryk for at sortere alle artikler efter deres oprettelsesdato (som det burde være).\nRækkefølgen bliver dog gal igen så snart en ældre artikel ændres :/"
    ).css({
        "text-decoration": "underline",
        "color": "#666666",
        "margin-bottom": "0"
    });

    // Header and navbar changes
    $(".header-logo").css("width", "unset");
    $(".header-logo .site-title").css("font-size", "21px");

    $(".sidebar").css({
        "min-height": "calc(100vh - 50px)",
        "width": "180px",
        "transition": "unset"
    });
    let skolebladNav = $(".sidebar .nav-item:first");
    let mainMenuNav = skolebladNav.clone().prependTo(".sidebar .navbar-nav");
    skolebladNav.html(skolebladNav.html().replace("htg-nyt", "læs htg-nyt"));
    skolebladNav.find(".nav-link").attr("href", "https://www.inspir.dk/e9a/htg");
    mainMenuNav.find("i").removeClass("fa-newspaper").addClass("fa-house");
    mainMenuNav.html(mainMenuNav.html().replace("htg-nyt", "hovedmenu"));
    mainMenuNav.find(".nav-link").attr("href", "https://www.inspir.dk/");
    let logoutNav = $(".sidebar .nav-item:last");
    logoutNav.css({
        "position": "unset",
        "bottom": "unset"
    });
    logoutNav.find(".nav-link").prepend("<i class=\"fas fa-right-from-bracket\" aria-hidden=\"true\"></i>");

    // Table changes before DataTable initialization
    $("#table thead tr:eq(0) th:eq(-1)").text("Handlinger").before("<th>Oprettelsesdato</th><th>Kategori</th><th>Synlighed</th>");
    $("#table thead tr:eq(1) th:eq(-1)").before("<th></th><th></th><th></th>");
    $("#table tbody tr").each((i, e) => {
        let articleUuid = $(e).find("td:eq(-1) button:eq(0)").data("article")
        $(e).attr("data-article-uuid", articleUuid);
        $(e).find("td:eq(-1)").before(`<td></td><td>...</td><td></td>`);

        let creationDateTime = getUuid1Date(articleUuid).getTime();
        $(e).find("td:eq(2)").text(creationDateTime);

        $(e).find("td:eq(5) button:eq(0)").remove();
        addVisibilityButtons(e, pageUuid);

        $(e).find("td:eq(5)").css({"width": "auto", "gap": "10px"});
        $(e).find("td:eq(5) button:eq(0)").text("Kopier link").on("click", () => {
            $.notify("Link til artikel kopieret", "success");
        });

        let editLinkNode = $(e).find(".edit-a");
        let editLink = editLinkNode.attr("href")
        $(e).attr("data-edit-link", editLink);
        editLinkNode.closest("td").text(editLinkNode.text().trim());
        addEditButton(e);

        addDeleteButton(e, pageUuid, articleUuid);
    });

    // Custom DataTable initialization

    // if (!$("#table").DataTable) location.reload();
    // ^ Probably a bad idea

    let dataTable = $("#table").DataTable({
        language: {
            "zeroRecords": "Ingen resultater fundet for denne søgning"
        },
        ordering: true,
        order: [[2, 'desc']],
        paging: false,
        searching: true,
        columnDefs: [
            {
                target: 1, render: (data, type, row) => {
                    if (data == "-") {
                        // This character will most likely always be sorted last
                        return type == "sort" ? "末" : (type == "filter" ? "" : data);
                    } else {
                        return data;
                    }
                }
            }, {
                target: 2, render: (data, type, row) => {
                    return type == "display" || type == "filter" ? formatDate(new Date(parseInt(data, 10))) : data;
                }, orderSequence: ["desc", "asc"]
            }, {
                target: 3, render: (data, type, row) => {
                    if (data == "-") {
                        return type == "sort" ? "末" : (type == "filter" ? "" : data);
                    } else {
                        return type == "display" ? `<i class="fas fa-${categoryIcons[data]}" aria-hidden="true"></i>&nbsp;&nbsp;` + data : data;
                    }
                }
            }, {
                targets: [4, 5], orderable: false
            }, {
                targets: [0, 1, 2, 3], width: "17%"
            }
        ]
    });

    addUpdateOrderButton(pageUuid, dataTable);
    $("#table tfoot, #table caption, #table_info, .filter-toolbar, #table_filter").remove();

    // Search fields (much like the default ones)
    let searchFields = $("<tr></tr>").appendTo("#table thead");
    for (let i = 0; i < 4; i++) {
        let column = dataTable.column(i);
        let columnTitle = $(column.header()).text().toLowerCase();
        let input = $(`<input type="text" placeholder="Søg efter ${columnTitle}"></input>`);
        input.on("keyup change clear", () => {
            console.log(column, column.search, column.search(), input.val());
            if (column.search() != input.val()) {
                column.search(input.val()).draw();
            }
        });
        $(`<th class="tableSearch"></th>`).append(input).appendTo(searchFields);
    }
    searchFields.append("<th></th><th></th>");

    // Table changes after DataTable intialization (which require requests)
    $("#table tbody tr").each((i, e) => {
        let editLink = $(e).data("edit-link")
        if (!editLink) return;

        fetch(editLink).then(res => res.text()).then(html => {
            let filtersElement = html.match(/<div id="static-filters".+?<\/div>/s)[0];
            let category = $(filtersElement).find("input:checked").next("label").text();
            dataTable.cell($(e).find("td:eq(3)")).data(`${category || "-"}`);

            let formHtml = html.match(/<form[^\n]+id="magazines-articles-form".+?<\/form>/s)[0];
            let status = $(formHtml).serialize().match(/status=(\w+)/)[1];
            let visButtonIndex = (status == "active") ? 0 : 1;
            $(e).find("td:eq(4) button").eq(visButtonIndex).addClass("current").css(visibilityButtonStyles.current);
        });
    });

    // Other changes
    $("#table td, #table th").css({"padding-left": "8px", "padding-right": "8px"});
    $(".tableSearch").css({"padding-left": "5px", "padding-right": "5px"});
    $("#table").css({
        "border-bottom": "1px solid #dee2e6",
        "table-layout": "fixed",
        "margin": "0"
    });
}

// Doing this so the onReady function will run after all other handlers
// It would otherwise run as the first since this script runs at document-start
$(() => {
    window.setTimeout(() => {
        onReady();
    }, 0);
});