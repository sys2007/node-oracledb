/* Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved. */

/******************************************************************************
 *
 * You may not use the identified files except in compliance with the Apache
 * License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * NAME
 *   lobinsert1.js
 *
 * DESCRIPTION
 *   Reads text from clobexample.txt and INSERTs it into a CLOB column.
 *   Reads binary data from fuzzydinosaur.jpg and INSERTs it into a BLOB column.
 *
 *   "Small" amounts of data can be bound directly for INSERT into LOB
 *   columns.  Larger amounts should be streamed, see lobinssert2.js.
 *   The boundary between 'small' and 'large' has a hard limit
 *   determined by the version of the Oracle client libraries, and a
 *   soft limit restricted by available memory.  See node-oracledb
 *   documentation.
 *
 *   Create clobexample.txt and fuzzydinosaur.jpg before running this example.
 *   Use demo.sql to create the required table or do:
 *     DROP TABLE mylobs;
 *     CREATE TABLE mylobs (id NUMBER, c CLOB, b BLOB);
 *
 *****************************************************************************/

var fs = require('fs');
var async = require('async');
var oracledb = require('oracledb');
var dbConfig = require('./dbconfig.js');

oracledb.autoCommit = true;  // for ease of demonstration only

var clobInFileName = 'clobexample.txt';    // the file with text to be inserted into the database
var blobInFileName = 'fuzzydinosaur.jpg';  // contains the image to be inserted into the database

var doconnect = function(cb) {
  oracledb.getConnection(
    {
      user          : dbConfig.user,
      password      : dbConfig.password,
      connectString : dbConfig.connectString
    },
    cb);
};

var dorelease = function(conn) {
  conn.close(function (err) {
    if (err)
      console.error(err.message);
  });
};

var docleanup = function (conn, cb) {
  conn.execute(
    'delete from mylobs',
    function(err) {
      return cb(err, conn);
    });
};

var doclobinsert = function(conn, cb) {
  var str = fs.readFileSync(clobInFileName, 'utf8');
  conn.execute(
    "INSERT INTO mylobs (id, c) VALUES (:id, :c)",
    { id: 1, c: str },
    function(err, result)
    {
      if (err) {
        return cb(err, conn);
      }
      if (result.rowsAffected != 1) {
        return cb(new Error('Error inserting CLOB'), conn);
      }
      console.log('CLOB inserted from ' + clobInFileName);
      cb(null, conn);
    });
};

var doblobinsert = function(conn, cb) {
  var buf = fs.readFileSync(blobInFileName);
  conn.execute(
    "INSERT INTO mylobs (id, b) VALUES (:id, :b)",
    { id: 2, b: buf },
    function(err, result)
    {
      if (err) {
        return cb(err, conn);
      }
      if (result.rowsAffected != 1) {
        return cb(new Error('Error inserting BLOB'), conn);
      }
      console.log('BLOB inserted from ' + blobInFileName);
      cb(null, conn);
    });
};

// Main routine
// Connect and call the CLOB and BLOB insertion examples
async.waterfall([
  doconnect,
  docleanup,
  doclobinsert,
  doblobinsert
],
function (err, conn) {
  if (err) { console.error("In waterfall error cb: ==>", err, "<=="); }
  if (conn)
    dorelease(conn);
});
