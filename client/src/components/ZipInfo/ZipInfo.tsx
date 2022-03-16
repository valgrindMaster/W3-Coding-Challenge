import { FormEventHandler, Fragment, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useQuery, gql } from "@apollo/client";
import countrycodes from "./Countrycodes";
import "./ZipInfo.scss";

const localStorageKey = "zip-code-info";

type ZipCodeInfo = { state: string; city: string; zipcode: number }[];

type ZipInfoQuery = {
  zipcodeinfo: {
    city: string;
    state: string;
  };
};

export const ZipInfo = () => {
  const storedZipcodeInfo = window.localStorage.getItem(localStorageKey);

  const prevData = useRef<ZipInfoQuery["zipcodeinfo"]>(null);
  const [lastFiveSearches, setLastFiveSearches] = useState<ZipCodeInfo>(
    storedZipcodeInfo ? JSON.parse(storedZipcodeInfo) : []
  );
  const [formData, setFormData] = useState<{
    countrycode: string;
    zipcode: number;
  }>({ countrycode: null, zipcode: null });

  const { countrycode, zipcode } = formData;

  const { data, error } = useQuery<ZipInfoQuery>(ZIP_INFO, {
    variables: { countrycode, zipcode },
    skip: !countrycode || !zipcode,
  });

  useEffect(() => {
    const zipcodeinfo = data?.zipcodeinfo;
    if (
      !zipcodeinfo ||
      (zipcodeinfo.city === prevData.current?.city &&
        zipcodeinfo.state === prevData.current?.state)
    ) {
      return null;
    }

    const newSearch = {
      state: zipcodeinfo.state,
      city: zipcodeinfo.city,
      zipcode,
    };

    const updatedSearches = [...lastFiveSearches];
    if (updatedSearches.length === 5) {
      updatedSearches.shift();
    }
    updatedSearches.push(newSearch);

    window.localStorage.setItem(
      localStorageKey,
      JSON.stringify(updatedSearches)
    );
    prevData.current = zipcodeinfo;
    setLastFiveSearches(updatedSearches);
  }, [data, lastFiveSearches, zipcode]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const target = event.target as HTMLFormElement;
    const formCountrycode = target.elements.namedItem(
      "countrycodes"
    ) as HTMLSelectElement;
    const formZipcode = target.elements.namedItem(
      "zipcode"
    ) as HTMLInputElement;
    if (
      formCountrycode &&
      formZipcode &&
      (countrycode !== formCountrycode.value ||
        String(zipcode) !== formZipcode.value)
    ) {
      prevData.current = data?.zipcodeinfo;
      setFormData({
        countrycode: formCountrycode.value,
        zipcode: Number(formZipcode.value),
      });
    }
  };

  const clearSearchHistory = () => {
    window.localStorage.removeItem(localStorageKey);
    prevData.current = null;
    setLastFiveSearches([]);
  };

  return (
    <div className="zip-info-wrapper">
      <h1>Zip Code Info</h1>
      <form onSubmit={handleSubmit}>
        <section className="form-section">
          <label className="form-label" htmlFor="countrycodes">
            Select a country
          </label>
          <select
            className="select"
            defaultValue="US"
            name="countrycodes"
            id="countrycodes"
          >
            {countrycodes.map((cc) => (
              <option key={cc.code} value={cc.code}>
                {cc.name}
              </option>
            ))}
          </select>
        </section>
        <section>
          <label className="form-label" htmlFor="zipcode">
            Provide a zipcode
          </label>
          <input
            type="text"
            id="zipcode"
            name="zipcode"
            pattern="[0-9]{5}"
            maxLength={5}
            placeholder="Zipcode..."
            className="zip-code-input"
          />
        </section>
        {error && <span>{error.message}</span>}
        <input className="submit" type="submit" value="Submit" />
      </form>
      {lastFiveSearches.length > 0 && (
        <button
          className="clear-search-history"
          type="button"
          onClick={clearSearchHistory}
        >
          Clear Search History
        </button>
      )}
      <table>
        <thead>
          <tr>
            <th>State</th>
            <th>City</th>
            <th>Zipcode</th>
          </tr>
        </thead>
        <tbody>
          {lastFiveSearches.length > 0 ? (
            lastFiveSearches.map((search) => (
              <Fragment key={`search-${uuidv4()}`}>
                <tr>
                  <td>{search.state}</td>
                  <td>{search.city}</td>
                  <td>{search.zipcode}</td>
                </tr>
              </Fragment>
            ))
          ) : (
            <tr>
              <td colSpan={3}>No search history recorded.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const ZIP_INFO = gql`
  query ZipInfo($countrycode: String!, $zipcode: Int!) {
    zipcodeinfo(countrycode: $countrycode, zipcode: $zipcode) {
      state
      city
    }
  }
`;
