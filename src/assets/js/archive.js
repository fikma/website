// TODO(chalin): package archive.js as its own top-level js so that it can be loaded independently

// Number of releases to show by default (rest will be behind a "show all" link).
var releasesToShow = 99999;

// Fetches Flutter release JSON for the given OS and calls the callback once the data is available.
var fetchFlutterReleases = function (os, callback, errorCallback) {
  // OS: windows, macos, linux
  var url = "https://storage.googleapis.com/flutter_infra_release/releases/releases_" + os + ".json";
  $.ajax({
    type: "GET",
    url: url,
    dataType: "json",
    success: function (data) { callback(data, os); },
    error: function (xhr, textStatus, errorThrown) {
      if (errorCallback) errorCallback(os);
    }
  })
}

function updateTable(releases, os) {
  var releaseData = releases.releases;

  for (var channel in releases.current_release) {
    var table = $("#downloads-" + os + "-" + channel);
    table.addClass("collapsed").find(".loading").remove();

    var releasesForChannel = releaseData.filter(function (release) {
      return release.channel == channel;
    });

    releasesForChannel.forEach(function (release, index) {
      // If this is the first row after the cut-off, insert the "Show more..." link.
      if (index === releasesToShow) {
        var showAll = $("<a />").text("Show all...").attr("href", "#").click(function (event) {
          $(this).closest("table").removeClass("collapsed");
          $(this).closest("tr").remove();
          event.preventDefault();
        });
        $("<tr>").append($("<td colspan=\"5\"></td></tr>").append(showAll)).appendTo(table);
      }

      var className = index >= releasesToShow ? "overflow" : "";
      var url = releases.base_url + "/" + release.archive;
      var row = $("<tr />").addClass(className).appendTo(table);
      var hashLabel = $("<span />").text(release.hash.substr(0, 7)).addClass("git-hash");
      var downloadLink = $("<a />").attr("href", url).text(release.version);
      var dartSdkVersion = $("<span />").text(
        release.dart_sdk_version ? release.dart_sdk_version.split(' ')[0]: '-',
      );
      var dartSdkArch = $("<span />").text(
        release.dart_sdk_arch ? release.dart_sdk_version: 'x64',
      );
      var date = new Date(Date.parse(release.release_date));
      $("<td />").append(downloadLink).appendTo(row);
      $("<td />").append(dartSdkArch).appendTo(row);
      $("<td />").append(hashLabel).appendTo(row);
      $("<td />").addClass("date").text(date.toLocaleDateString()).appendTo(row);
      $("<td />").append(dartSdkVersion).appendTo(row);
    });
  }
}

function updateTableFailed(os) {
  var tab = $("#tab-os-" + os);
  tab.find(".loading").text("Failed to load releases. Refresh page to try again.");
}

function updateDownloadLink(releases, os) {
  var channel = "stable";
  var releasesForChannel = releases.releases.filter(function (release) {
    return release.channel == channel;
  });
  if (!releasesForChannel.length)
    return;

  var release = releasesForChannel[0];
  var linkSegments = release.archive.split("/");
  var archiveFilename = linkSegments[linkSegments.length - 1]; // Just the filename part of url
  var downloadLink = $(".download-latest-link-" + os);
  downloadLink
    .text(archiveFilename)
    .attr("href", releases.base_url + "/" + release.archive);

  // Update download-filename placeholders:
  $(".download-latest-link-filename-" + os).text(archiveFilename);
  $(".download-latest-link-filename").text(archiveFilename);

  // Update inlined filenames in <code> element text nodes:
  var fileNamePrefix = 'flutter_';
  var code = $('code:contains("' + fileNamePrefix + '")');
  var textNode = $(code).contents().filter(function() {
    return this.nodeType == 3 && this.textContent.includes(fileNamePrefix);
  });
  var text = $(textNode).text();
  var newText = text.replace(new RegExp('^(.*?)\\b' + fileNamePrefix + '\\w+_v.*'), '$1' + archiveFilename);
  $(textNode).replaceWith(newText);
}

function updateDownloadLinkFailed(os) {
  $(".download-latest-link-" + os).text("(failed)");
}

// Send requests to render the tables.
$(function () {
  if ($("#sdk-archives").length) {
    fetchFlutterReleases("windows", updateTable, updateTableFailed);
    fetchFlutterReleases("macos", updateTable, updateTableFailed);
    fetchFlutterReleases("linux", updateTable, updateTableFailed);
  }
  if ($(".download-latest-link-windows").length)
    fetchFlutterReleases("windows", updateDownloadLink, updateDownloadLinkFailed);
  if ($(".download-latest-link-macos").length)
    fetchFlutterReleases("macos", updateDownloadLink, updateDownloadLinkFailed);
  if ($(".download-latest-link-linux").length)
    fetchFlutterReleases("linux", updateDownloadLink, updateDownloadLinkFailed);
});

