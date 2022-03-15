import { FormEventHandler, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useQuery, gql } from "@apollo/client";
import countrycodes from "./Countrycodes";

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
    <div>
      <h1>Zip Code Info</h1>
      <form onSubmit={handleSubmit}>
        <section>
          <label htmlFor="countrycodes">Select a country</label>
          <select defaultValue="US" name="countrycodes" id="countrycodes">
            {countrycodes.map((cc) => (
              <option key={cc.code} value={cc.code}>
                {cc.name}
              </option>
            ))}
          </select>
          <label htmlFor="zipcode">Provide a zipcode</label>
          <input
            type="text"
            id="zipcode"
            name="zipcode"
            pattern="[0-9]{5}"
            maxLength={5}
            placeholder="Zipcode..."
          />
        </section>
        {error && <span>{error.message}</span>}
        <input type="submit" value="Submit" />
      </form>
      {data?.zipcodeinfo && (
        <section>
          <h2>Your Most Recent Zip Code Info:</h2>
          <div>City: {data.zipcodeinfo.city}</div>
          <div>State: {data.zipcodeinfo.state}</div>
        </section>
      )}
      <button type="button" onClick={clearSearchHistory}>
        Clear Search History
      </button>
      {lastFiveSearches.length > 0 && (
        <ol>
          {lastFiveSearches.map((search) => {
            return (
              <li key={`search-${uuidv4()}`}>
                <div>{search.state}</div>
                <div>{search.city}</div>
                <div>{search.zipcode}</div>
              </li>
            );
          })}
        </ol>
      )}
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
